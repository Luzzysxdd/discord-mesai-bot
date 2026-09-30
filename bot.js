/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 MESAI BOT - MAIN ENTRY POINT
 * ═══════════════════════════════════════════════════════════════
 * Discord.js v14 - Premium Mesai Management System
 * Developed By: Luzzysxdd (https://github.com/Luzzysxdd)
 * 
 * PRODUCTION STABLE - VDS Ready with Error Recovery
 */

import {
  Client,
  GatewayIntentBits,
  Collection,
  ChannelType,
  REST,
  Routes,
  MessageFlags,
} from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import config from "./config.js";
import logger from "./utils/logger.js";
import {
  initializeDatabase,
  mesaiDB,
  logsDB,
} from "./db.js";
import {
  isUserInVoiceChannel,
  hasRole,
  isAdmin,
  sendDMToUser,
} from "./utils/helpers.js";
import {
  mesaiEmbeds,
  notificationEmbeds,
  PremiumEmbed,
  formatTime,
} from "./utils/embeds.js";

// Load .env
dotenv.config();

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══ PRODUCTION MODE DETECTION ═══
const isProd = process.env.NODE_ENV === "production";

// ═══ GRACEFUL SHUTDOWN TRACKING ═══
let isShuttingDown = false;
let shiftControlLoopId = null;

/**
 * ═══ BOT CLIENT SETUP ═══
 */

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Command collection
bot.commands = new Collection();
bot.events = new Collection();

// Interaction deduplication - aynı interaction'ın iki kez işlenmesini önle
const processedInteractions = new Set();
function markInteraction(id) {
  if (processedInteractions.has(id)) return false;
  processedInteractions.add(id);
  // 60 saniye sonra temizle (memory leak önleme)
  setTimeout(() => processedInteractions.delete(id), 60000);
  return true;
}

/**
 * ═══ LOAD COMMANDS ═══
 */

async function loadCommands() {
  logger.info("Loading commands...");

  const commandsPath = path.join(__dirname, "commands");

  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath, { recursive: true });
    logger.warn(
      "Commands directory created. Add your commands there."
    );
    return;
  }

  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js") && !file.startsWith("_"));

  for (const file of commandFiles) {
    try {
      const filePath = path.join(commandsPath, file);
      const command = (await import(`file://${filePath}`)).default;

      if (command.data && command.execute) {
        bot.commands.set(command.data.name, command);
        logger.success(`Loaded command: ${command.data.name}`);
      }
    } catch (error) {
      logger.error(`Failed to load command ${file}:`, error);
    }
  }

  logger.info(`✅ Total ${bot.commands.size} commands loaded.`);
}

/**
 * ═══ LOAD EVENTS ═══
 */

async function loadEvents() {
  logger.info("Loading events...");

  const eventsPath = path.join(__dirname, "events");

  if (!fs.existsSync(eventsPath)) {
    fs.mkdirSync(eventsPath, { recursive: true });
    return;
  }

  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    try {
      const filePath = path.join(eventsPath, file);
      const event = (await import(`file://${filePath}`)).default;

      if (event.name && event.execute) {
        if (event.once) {
          bot.once(event.name, (...args) =>
            event.execute(bot, ...args)
          );
        } else {
          bot.on(event.name, (...args) =>
            event.execute(bot, ...args)
          );
        }
        logger.success(`Loaded event: ${event.name}`);
      }
    } catch (error) {
      logger.error(`Failed to load event ${file}:`, error);
    }
  }

  logger.info(`✅ Events loaded.`);
}

/**
 * ═══ REGISTER SLASH COMMANDS ═══
 */

async function registerSlashCommands() {
  logger.info("Registering slash commands to Discord...");

  const commands = [];

  bot.commands.forEach((cmd) => {
    if (cmd.data) {
      commands.push(cmd.data.toJSON());
    }
  });

  try {
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN
    );

    const result = await rest.put(
      Routes.applicationCommands(bot.user.id),
      { body: commands }
    );

    logger.success(
      `✅ Registered ${result.length} slash commands!`
    );
  } catch (error) {
    logger.error("Failed to register slash commands:", error);
  }
}

/**
 * ═══ SHIFT CONTROL LOOP - CORE LOGIC WITH ERROR RECOVERY ═══
 */

function startShiftControlLoop() {
  if (isShuttingDown) {
    logger.warn("Shift control loop start cancelled - bot is shutting down");
    return;
  }

  logger.info("🔄 Starting Shift Control Loop...");

  // Check every 60 seconds (60000ms)
  shiftControlLoopId = setInterval(async () => {
    // Skip if shutting down
    if (isShuttingDown) return;

    try {
      bot.guilds.cache.forEach(async (guild) => {
        // Skip if shutting down
        if (isShuttingDown) return;

        try {
          // Get all active shifts in this guild
          const activeUsers = mesaiDB.getActiveUsers(guild.id);

          for (const shift of activeUsers) {
            // Skip if shutting down
            if (isShuttingDown) break;

            try {
              const member = await guild.members.fetch(
                shift.userId
              );

              // ═══ CHECK 1: IS USER IN VOICE CHANNEL? ═══
              if (!isUserInVoiceChannel(member)) {
                // Kullanıcı ses kanalında değil - ÇIK
                const result = mesaiDB.endShift(
                  shift.userId,
                  guild.id
                );

                // Embed gönder
                try {
                  await sendDMToUser(
                    member.user,
                    {
                      embeds: [
                        mesaiEmbeds.autoKickFromShift(
                          member.user,
                          "Ses kanalından ayrıldığın için"
                        ),
                      ],
                    }
                  );
                } catch (dmError) {
                  logger.debug(
                    `Couldn't send DM to ${member.user.tag}`
                  );
                }

                // Log
                logsDB.addLog(
                  guild.id,
                  "mesaiCikis",
                  `${member.user.tag} automatically removed from shift (left voice)`
                );

                // Tag'ı kaldır
                const tagRole = guild.roles.cache.find(
                  (r) => r.name === config.mesai.shiftTag
                );
                if (tagRole && member.roles.cache.has(tagRole.id)) {
                  await member.roles.remove(tagRole);
                }

                logger.info(
                  `[${guild.name}] ${member.user.tag} kicked from shift (no voice)`
                );
                continue;
              }

              // ═══ CHECK 2: IS USER PLAYING GAME? ═══
              if (config.mesai.gameDetectionEnabled) {
                const activity = member.presence?.activities[0];

                if (activity && activity.type === 0) {
                  // Type 0 = Playing
                  const gameName = activity.name;
                  const isAllowed = config.mesai.allowedGames.some(
                    (game) =>
                      gameName.toLowerCase().includes(
                        game.toLowerCase()
                      )
                  );

                  if (!isAllowed) {
                    // İzin verilen oyun değil
                    logger.warn(
                      `[${guild.name}] ${member.user.tag} is playing ${gameName} (not allowed)`
                    );

                    // Log it
                    logsDB.addLog(
                      guild.id,
                      "mesaiGiris",
                      `${member.user.tag} detected playing unauthorized game: ${gameName}`
                    );
                  }
                }
              }

              // ═══ CHECK 3: IS USER EXEMPT? ═══
              const exemptRoleExists = config.mesai.exemptRoles.some(
                (roleId) =>
                  member.roles.cache.has(roleId)
              );

              if (exemptRoleExists) {
                logger.debug(
                  `[${guild.name}] ${member.user.tag} is exempt from checks`
                );
                continue; // Skip further checks
              }
            } catch (memberError) {
              if (memberError.code !== 10007) {
                // Not "Unknown Member" error
                logger.debug(
                  `Error checking member ${shift.userId}: ${memberError.message}`
                );
              }
            }
          }
        } catch (guildError) {
          logger.debug(
            `Error processing guild ${guild.name}: ${guildError.message}`
          );
        }
      });
    } catch (loopError) {
      logger.error(
        "Error in shift control loop:",
        loopError
      );
      // Log error but don't crash
      logsDB.addLog(
        "SYSTEM",
        "botError",
        `Shift control loop error: ${loopError.message}`
      );
    }
  }, config.mesai.checkIntervalMs);

  logger.success("✅ Shift Control Loop Started!");
}

/**
 * ═══ BOT READY EVENT ═══
 */

bot.once("ready", async () => {
  logger.success(
    `═══════════════════════════════════════════════════════════════`
  );
  logger.success(
    `🤖 MESAI BOT v${config.bot.version} - READY!`
  );
  logger.success(
    `═══════════════════════════════════════════════════════════════`
  );

  logger.info(`📛 Bot User: ${bot.user.tag}`);
  logger.info(`🏢 Guilds: ${bot.guilds.cache.size}`);
  logger.info(
    `⚙️ Commands: ${bot.commands.size}`
  );

  // Set status
  bot.user.setActivity(config.bot.status, {
    type: config.bot.statusType,
  });

  logger.success(
    `✨ Status: ${config.bot.status}`
  );

  // Start shift control loop
  startShiftControlLoop();
});

/**
 * ═══ SLASH COMMAND INTERACTION ═══
 */

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (!markInteraction(interaction.id)) return;

  const command = bot.commands.get(
    interaction.commandName
  );

  if (!command) {
    logger.warn(
      `Command not found: ${interaction.commandName}`
    );
    return;
  }

  try {
    await command.execute(interaction, bot);
  } catch (error) {
    logger.error(
      `Error executing command ${interaction.commandName}:`,
      error
    );

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embeds: [notificationEmbeds.errorLog(error, `Command: /${interaction.commandName}`)],
        });
      } else {
        await interaction.reply({
          embeds: [notificationEmbeds.errorLog(error, `Command: /${interaction.commandName}`)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      logger.debug(`Komut hata mesajı gönderilemedi: ${replyError.message}`);
    }
  }
});

/**
 * ═══ BUTTON INTERACTION ═══
 * Gelişmiş UI/UX Buton İşleyicileri
 */

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (!markInteraction(interaction.id)) return;

  const [action, ...params] = interaction.customId.split("_");

  logger.debug(`Button pressed: ${interaction.customId}`);

  try {
    // ═══ MESAI PANEL BUTTONS ═══
    if (action === "mesai") {
      const { 
        handleMesaiGiris, 
        handleMesaiCikis, 
        handleMesaiKontrol,
        handleMesaiAktifler,
        handleMesaiLeaderboard 
      } = await import("./commands/mesai-panel.js");

      switch (params[0]) {
        case "giris":
          await handleMesaiGiris(interaction, bot);
          break;
        case "cikis":
          await handleMesaiCikis(interaction, bot);
          break;
        case "kontrol":
          await handleMesaiKontrol(interaction, bot);
          break;
        case "aktifler":
          await handleMesaiAktifler(interaction, bot);
          break;
        case "leaderboard":
          await handleMesaiLeaderboard(interaction, bot);
          break;
        default:
          logger.warn(`Unknown mesai button: ${params[0]}`);
      }
      return;
    }

    // ═══ SETUP PANEL BUTTONS ═══
    if (action === "setup") {
      const setupAction = params[0];
      
      if (setupAction === "mesai" && params[1] === "panel") {
        const { handleAutoSetup } = await import("./commands/setup.js");
        await interaction.reply({
          embeds: [PremiumEmbed.info("🔄 Yönlendirme", "Lütfen `/mesai-panel` komutunu kullanın.")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      
      if (setupAction === "mazeret" && params[1] === "panel") {
        await interaction.reply({
          embeds: [PremiumEmbed.info("🔄 Yönlendirme", "Lütfen `/mazeret panel` komutunu kullanın.")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      
      if (setupAction === "ticket" && params[1] === "panel") {
        await interaction.reply({
          embeds: [PremiumEmbed.info("🔄 Yönlendirme", "Lütfen `/ticket-setup panel` komutunu kullanın.")],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
    }

    // ═══ MAZERET PANEL BUTTONS ═══
    if (action === "mazeret") {
      const { handleMazeretPanelButton, handleMazeretDecisionButton } = await import("./commands/mazeret.js");
      
      if (params[0] === "open" || params[0] === "listele") {
        await handleMazeretPanelButton(interaction, bot);
        return;
      }
      
      if (params[0] === "approve" || params[0] === "reject") {
        await handleMazeretDecisionButton(interaction, bot);
        return;
      }
    }

    // ═══ TICKET BUTTONS ═══
    if (action === "ticket") {
      const { 
        handleTicketCreate, 
        handleTicketCloseButton, 
        handleTicketTranscript 
      } = await import("./commands/ticket-setup.js");

      if (params[0] === "create") {
        await handleTicketCreate(interaction, bot, params[1]);
        return;
      }
      
      if (params[0] === "close") {
        await handleTicketCloseButton(interaction, bot);
        return;
      }
      
      if (params[0] === "transcript") {
        await handleTicketTranscript(interaction, bot);
        return;
      }
    }

  } catch (error) {
    logger.error(`Button interaction error: ${error.message}`, error);
    
    try {
      // showModal sonrası interaction zaten cevaplandı, tekrar reply yapmaya çalışma
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embeds: [notificationEmbeds.errorLog(error, `Button: ${interaction.customId}`)],
        });
      } else {
        await interaction.reply({
          embeds: [notificationEmbeds.errorLog(error, `Button: ${interaction.customId}`)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      // Interaction zaten expired veya acknowledged olmuş, sessizce logla
      logger.debug(`Button error mesajı gönderilemedi: ${replyError.message}`);
    }
  }
});

/**
 * ═══ SELECT MENU INTERACTION ═══
 * Gelişmiş UI/UX Select Menü İşleyicileri
 */

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (!markInteraction(interaction.id)) return;

  logger.debug(`Select menu used: ${interaction.customId}`);

  try {
    const [action, ...params] = interaction.customId.split("_");

    // ═══ TICKET SELECT MENU ═══
    if (action === "ticket" && params[0] === "create" && params[1] === "select") {
      const category = interaction.values[0];
      const { handleTicketCreate } = await import("./commands/ticket-setup.js");
      await handleTicketCreate(interaction, bot, category);
      return;
    }

  } catch (error) {
    logger.error(`Select menu error: ${error.message}`, error);
    
    try {
      await interaction.reply({
        embeds: [notificationEmbeds.errorLog(error, `Select: ${interaction.customId}`)],
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      logger.error("Failed to send select menu error message:", replyError);
    }
  }
});

/**
 * ═══ MODAL SUBMISSION ═══
 * Gelişmiş UI/UX Modal İşleyicileri
 */

bot.on("interactionCreate", async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (!markInteraction(interaction.id)) return;

  logger.debug(`Modal submitted: ${interaction.customId}`);

  try {
    const [action, ...params] = interaction.customId.split("_");

    // ═══ MAZERET MODAL ═══
    if (action === "mazeret" && params[0] === "modal" && params[1] === "submit") {
      const { handleMazeretModalSubmit } = await import("./commands/mazeret.js");
      await handleMazeretModalSubmit(interaction, bot);
      return;
    }

    // ═══ MAZERET DECISION MODAL (Onay/Red) ═══
    if (action === "mazeret" && params[0] === "decision") {
      const { handleMazeretDecisionModalSubmit } = await import("./commands/mazeret.js");
      await handleMazeretDecisionModalSubmit(interaction, bot);
      return;
    }

    // ═══ TICKET MODAL ═══
    if (action === "ticket" && params[0] === "modal") {
      const { handleTicketModalSubmit } = await import("./commands/ticket-setup.js");
      await handleTicketModalSubmit(interaction, bot, params[1]);
      return;
    }

    // ═══ TICKET CLOSE CONFIRM MODAL ═══
    if (action === "ticket" && params[0] === "close" && params[1] === "confirm") {
      const { handleTicketCloseConfirm } = await import("./commands/ticket-setup.js");
      await handleTicketCloseConfirm(interaction, bot);
      return;
    }

  } catch (error) {
    logger.error(`Modal submission error: ${error.message}`, error);
    
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embeds: [notificationEmbeds.errorLog(error, `Modal: ${interaction.customId}`)],
        });
      } else {
        await interaction.reply({
          embeds: [notificationEmbeds.errorLog(error, `Modal: ${interaction.customId}`)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      logger.debug(`Modal error mesajı gönderilemedi: ${replyError.message}`);
    }
  }
});

/**
 * ═══ VOICE STATE UPDATE ═══
 */

bot.on("voiceStateUpdate", async (oldState, newState) => {
  try {
    const member = newState.member;
    const guild = newState.guild;

    // Check if member joined a voice channel
    if (!oldState.channel && newState.channel) {
      logger.debug(
        `${member.user.tag} joined voice channel: ${newState.channel.name}`
      );

      // TODO: Auto-shift start if enabled
      // This would be configured per guild
    }

    // Check if member left a voice channel
    if (oldState.channel && !newState.channel) {
      logger.debug(
        `${member.user.tag} left voice channel: ${oldState.channel.name}`
      );

      // TODO: Auto-shift end or warning
    }
  } catch (error) {
    logger.error("Error in voiceStateUpdate:", error);
  }
});

/**
 * ═══ ERROR HANDLING ═══
 */

bot.on("error", (error) => {
  logger.error("Client error:", error);
  logsDB.addLog("SYSTEM", "botError", `Client error: ${error.message}`);
});

bot.on("warn", (warning) => {
  logger.warn(`Discord.js Warning: ${warning}`);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection:", reason);
  logsDB.addLog(
    "SYSTEM",
    "botError",
    `Unhandled rejection: ${String(reason)}`
  );
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  logsDB.addLog(
    "SYSTEM",
    "botError",
    `Uncaught exception: ${error.message}`
  );
  // In production, let PM2 handle restart
});

/**
 * ═══ GRACEFUL SHUTDOWN ═══
 */

function gracefulShutdown(signal) {
  if (isShuttingDown) {
    logger.warn(`Already shutting down, ${signal} received again`);
    return;
  }

  logger.info(`\n📋 ${signal} received - graceful shutdown initiated...`);
  isShuttingDown = true;

  // Clear shift control loop
  if (shiftControlLoopId) {
    clearInterval(shiftControlLoopId);
    logger.info("🛑 Shift control loop stopped");
  }

  // Disconnect bot
  if (bot.user) {
    try {
      bot.user.setActivity("🔴 KAPALI", { type: 0 });
    } catch (e) {
      logger.debug("Could not update status");
    }
  }

  // Close database
  try {
    logger.info("💾 Closing database...");
    // Database auto-closes, but we log it
  } catch (e) {
    logger.error("Error closing database:", e);
  }

  // Disconnect from Discord
  setTimeout(() => {
    logger.info("🚪 Disconnecting from Discord...");
    bot.destroy();

    logger.success("✅ Bot gracefully shut down");

    // Send ready signal to PM2
    if (process.send) {
      process.send("ready");
    }

    process.exit(0);
  }, 2000);

  // Force exit after 15 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error("❌ Graceful shutdown timeout - force exiting");
    process.exit(1);
  }, 15000);
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));

/**
 * ═══ INITIALIZE & LOGIN ═══
 */

async function start() {
  try {
    logger.info("🚀 Starting bot initialization...");
    logger.info(
      `📍 Mode: ${isProd ? "PRODUCTION" : "DEVELOPMENT"}`
    );

    // Initialize database
    await initializeDatabase();

    // Load commands
    await loadCommands();

    // Load events
    await loadEvents();

    // Login to Discord
    await bot.login(process.env.DISCORD_TOKEN);

    logger.success("✅ Bot logged in successfully!");

    // Register slash commands after bot is ready
    bot.once("ready", async () => {
      await registerSlashCommands();
    });
  } catch (error) {
    logger.error("Failed to start bot:", error);

    if (isProd) {
      // In production, let PM2 restart it
      logger.info("⏳ Waiting before restart...");
      await new Promise((resolve) =>
        setTimeout(resolve, 5000)
      );
      process.exit(1);
    } else {
      process.exit(1);
    }
  }
}

// Start the bot
start();

// Ready signal for PM2
if (process.send) {
  process.send("ready");
}

export default bot;
