/**
 * ═══════════════════════════════════════════════════════════════
 * 🔧 COMMAND: SETUP - Auto Server Setup
 * ═══════════════════════════════════════════════════════════════
 * Tüm log kanallarını ve veritabanı tablolarını otomatik kurar
 * Gelişmiş, endüstriyel modern UI ile
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from "discord.js";
import { db, initializeDatabase, logsDB } from "../db.js";
import { PremiumEmbed, PremiumButtonRow } from "../utils/embeds.js";
import { createChannelWithRetry, createRoleWithRetry } from "../utils/retry.js";
import logger from "../utils/logger.js";
import config from "../config.js";

// Kanal kategorileri yapılandırması
const CHANNEL_CATEGORIES = {
  mesai: {
    name: "🚨-mesai-log",
    topic: "Mesai giriş/çıkış kayıtları | Luzzysxdd",
    reason: "Mesai Log Kanalı",
  },
  ceza: {
    name: "⚠️-ceza-log",
    topic: "Ceza ve uyarı kayıtları | Luzzysxdd",
    reason: "Ceza Log Kanalı",
  },
  mazeret: {
    name: "📝-mazeret-log",
    topic: "Mazeret bildirim kayıtları | Luzzysxdd",
    reason: "Mazeret Log Kanalı",
  },
  ticket: {
    name: "🎫-ticket-log",
    topic: "Ticket işlem kayıtları | Luzzysxdd",
    reason: "Ticket Log Kanalı",
  },
  birim: {
    name: "👮-birim-log",
    topic: "Birim ve devriye kayıtları | Luzzysxdd",
    reason: "Birim Log Kanalı",
  },
  bot: {
    name: "🤖-bot-log",
    topic: "Bot işlem ve hata kayıtları | Luzzysxdd",
    reason: "Bot Log Kanalı",
  },
};

export default {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Botun tüm sistemlerini otomatik kurar (Log kanalları, veritabanı, roller)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("auto")
        .setDescription("Tüm sistemleri otomatik kur (Log kanalları + Veritabanı)")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("channels")
        .setDescription("Sadece log kanallarını oluştur")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("database")
        .setDescription("Sadece veritabanı tablolarını oluştur")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("roles")
        .setDescription("Mesai tag rolünü ve diğer sistem rollerini oluştur")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("Mevcut kurulum durumunu kontrol et")
    ),

  async execute(interaction, bot) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const user = interaction.user;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      switch (subcommand) {
        case "auto":
          await handleAutoSetup(interaction, guild, user);
          break;
        case "channels":
          await handleChannelSetup(interaction, guild, user);
          break;
        case "database":
          await handleDatabaseSetup(interaction, guild, user);
          break;
        case "roles":
          await handleRoleSetup(interaction, guild, user);
          break;
        case "status":
          await handleStatusCheck(interaction, guild, user);
          break;
        default:
          await interaction.editReply({
            embeds: [
              PremiumEmbed.error(
                "❌ Bilinmeyen Komut",
                "Geçersiz alt komut kullanıldı."
              ),
            ],
          });
      }
    } catch (error) {
      logger.error(`Setup command error: ${error.message}`, error);
      await interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            "❌ Kurulum Hatası",
            `Bir hata oluştu: \`${error.message}\`
\nLütfen daha sonra tekrar deneyin veya yöneticiye başvurun.`
          ),
        ],
      });
    }
  },
};

/**
 * 🔧 Otomatik Tam Kurulum
 */
async function handleAutoSetup(interaction, guild, user) {
  const progressEmbed = PremiumEmbed.info(
    "🔧 Otomatik Kurulum Başlatılıyor...",
    `Merhaba **${user.username}**!\n\nBotun tüm sistemleri otomatik olarak kurulacak:\n\n` +
      `📋 **Yapılacak İşlemler:**\n` +
      `⬜ Log Kanalları Oluşturma\n` +
      `⬜ Veritabanı Tabloları\n` +
      `⬜ Sistem Rolleri\n` +
      `⬜ Ayarların Kaydedilmesi\n\n` +
      `*Lütfen bekleyin, bu işlem birkaç saniye sürebilir...*`
  );

  await interaction.editReply({ embeds: [progressEmbed] });

  const results = {
    channels: [],
    database: false,
    roles: [],
    errors: [],
  };

  // 1. Log Kanalları Oluştur
  try {
    for (const [key, channelConfig] of Object.entries(CHANNEL_CATEGORIES)) {
      try {
        // Kanal var mı kontrol et
        const existingChannel = guild.channels.cache.find(
          (c) => c.name === channelConfig.name
        );

        if (existingChannel) {
          results.channels.push({
            name: channelConfig.name,
            id: existingChannel.id,
            status: "existing",
          });
          // Ayarlara kaydet
          saveChannelId(guild.id, key, existingChannel.id);
        } else {
          // Retry mekanizması ile kanal oluştur
          const newChannel = await createChannelWithRetry(guild, {
            name: channelConfig.name,
            type: ChannelType.GuildText,
            topic: channelConfig.topic,
            reason: channelConfig.reason,
          });

          results.channels.push({
            name: channelConfig.name,
            id: newChannel.id,
            status: "created",
          });

          // Ayarlara kaydet
          saveChannelId(guild.id, key, newChannel.id);
        }
      } catch (err) {
        results.errors.push(`Kanal ${channelConfig.name}: ${err.message}`);
      }
    }
  } catch (error) {
    results.errors.push(`Kanal oluşturma hatası: ${error.message}`);
  }

  // 2. Veritabanı Kurulumu
  try {
    await initializeDatabase();

    // Guild ayarlarını kaydet
    const guildSettings = {
      guildId: guild.id,
      guildName: guild.name,
      setupCompleted: true,
      setupDate: Date.now(),
      setupBy: user.id,
      channels: getGuildChannels(guild.id),
    };

    db.set(`guild_settings_${guild.id}`, guildSettings);
    results.database = true;
  } catch (error) {
    results.errors.push(`Veritabanı hatası: ${error.message}`);
  }

  // 3. Rol Kurulumu
  try {
    // Mesai Tag Rolü
    const shiftTagRole = guild.roles.cache.find(
      (r) => r.name === config.mesai.shiftTag
    );

    if (!shiftTagRole) {
      // Retry mekanizması ile rol oluştur
      const newRole = await createRoleWithRetry(guild, {
        name: config.mesai.shiftTag,
        color: config.colorHex.success,
        hoist: false,
        mentionable: false,
        reason: "Mesai tag rolü - Otomatik kurulum",
      });
      results.roles.push({
        name: config.mesai.shiftTag,
        id: newRole.id,
        status: "created",
      });
    } else {
      results.roles.push({
        name: config.mesai.shiftTag,
        id: shiftTagRole.id,
        status: "existing",
      });
    }
  } catch (error) {
    results.errors.push(`Rol oluşturma hatası: ${error.message}`);
  }

  // Log kaydı
  logsDB.addLog(
    guild.id,
    "settingChange",
    `${user.tag} otomatik kurulum tamamladı`,
    {
      userId: user.id,
      channels: results.channels.length,
      database: results.database,
      roles: results.roles.length,
    }
  );

  // Başarı Embed'i
  const successEmbed = PremiumEmbed.success(
    "✅ Kurulum Tamamlandı!",
    `**${guild.name}** sunucusu için kurulum başarıyla tamamlandı.\n\n` +
      `📊 **Özet:**\n` +
      `• ${results.channels.length} Log Kanalı\n` +
      `• ${results.roles.length} Sistem Rolü\n` +
      `• Veritabanı: ${results.database ? "✅ Hazır" : "❌ Hata"}\n\n` +
      `🔰 **Geliştirici:** ${config.branding.developer}`
  );

  // Kanal listesi
  const channelList = results.channels
    .map((ch) => `${ch.status === "created" ? "🆕" : "✅"} <#${ch.id}>`)
    .join("\n");

  if (channelList) {
    successEmbed.addFields({
      name: "📋 Log Kanalları",
      value: channelList,
      inline: false,
    });
  }

  // Hatalar varsa göster
  if (results.errors.length > 0) {
    successEmbed.addFields({
      name: "⚠️ Uyarılar",
      value: results.errors.slice(0, 3).join("\n"),
      inline: false,
    });
  }

  // Devam Et Butonları
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_mesai_panel")
      .setLabel("🚨 Mesai Paneli Kur")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("setup_mazeret_panel")
      .setLabel("📝 Mazeret Paneli Kur")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("setup_ticket_panel")
      .setLabel("🎫 Ticket Paneli Kur")
      .setStyle(ButtonStyle.Secondary)
  );

  await interaction.editReply({
    embeds: [successEmbed],
    components: [row],
  });

  logger.info(`[${guild.name}] ${user.tag} completed auto setup`);
}

/**
 * 📋 Sadece Kanal Kurulumu
 */
async function handleChannelSetup(interaction, guild, user) {
  const results = [];

  for (const [key, channelConfig] of Object.entries(CHANNEL_CATEGORIES)) {
    try {
      const existingChannel = guild.channels.cache.find(
        (c) => c.name === channelConfig.name
      );

      if (existingChannel) {
        results.push(`✅ ${channelConfig.name} - Zaten mevcut`);
        saveChannelId(guild.id, key, existingChannel.id);
      } else {
        // Retry mekanizması ile kanal oluştur
        const newChannel = await createChannelWithRetry(guild, {
          name: channelConfig.name,
          type: ChannelType.GuildText,
          topic: channelConfig.topic,
          reason: `${user.tag} tarafından kurulum sırasında oluşturuldu`,
        });
        results.push(`🆕 ${channelConfig.name} - Oluşturuldu`);
        saveChannelId(guild.id, key, newChannel.id);
      }
    } catch (err) {
      results.push(`❌ ${channelConfig.name} - Hata: ${err.message}`);
    }
  }

  const embed = PremiumEmbed.info(
    "📋 Kanal Kurulum Durumu",
    results.join("\n")
  );

  await interaction.editReply({ embeds: [embed] });
}

/**
 * 💾 Veritabanı Kurulumu
 */
async function handleDatabaseSetup(interaction, guild, user) {
  try {
    await initializeDatabase();

    db.set(`guild_settings_${guild.id}`, {
      guildId: guild.id,
      setupDate: Date.now(),
      setupBy: user.id,
    });

    const embed = PremiumEmbed.success(
      "💾 Veritabanı Hazır",
      `Veritabanı tabloları başarıyla oluşturuldu ve hazırlandı.\n\n` +
        `**Hazır Tablolar:**\n` +
        `• Mesaİ/Shift Verileri\n` +
        `• Leaderboard\n` +
        `• Mazeretler\n` +
        `• Birimler\n` +
        `• Ticketler\n` +
        `• Cezalar\n` +
        `• Log Kayıtları`
    );

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    await interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Veritabanı Hatası",
          `Veritabanı kurulumu başarısız: ${error.message}`
        ),
      ],
    });
  }
}

/**
 * 🎭 Rol Kurulumu
 */
async function handleRoleSetup(interaction, guild, user) {
  const results = [];

  try {
    // Mesai Tag Rolü
    const shiftTagRole = guild.roles.cache.find(
      (r) => r.name === config.mesai.shiftTag
    );

    if (!shiftTagRole) {
      // Retry mekanizması ile rol oluştur
      const newRole = await createRoleWithRetry(guild, {
        name: config.mesai.shiftTag,
        color: config.colorHex.success,
        reason: "Mesai tag rolü",
      });
      results.push(`🆕 [M] Mesai Tag Rolü oluşturuldu`);
    } else {
      results.push(`✅ [M] Mesai Tag Rolü zaten mevcut`);
    }
  } catch (error) {
    results.push(`❌ Rol oluşturma hatası: ${error.message}`);
  }

  const embed = PremiumEmbed.info("🎭 Rol Kurulum Durumu", results.join("\n"));
  await interaction.editReply({ embeds: [embed] });
}

/**
 * 📊 Kurulum Durumu Kontrolü
 */
async function handleStatusCheck(interaction, guild, user) {
  const settings = db.get(`guild_settings_${guild.id}`) || {};

  const channels = [];
  for (const [key, config] of Object.entries(CHANNEL_CATEGORIES)) {
    const channelId = settings.channels?.[key];
    const channel = channelId ? guild.channels.cache.get(channelId) : null;
    channels.push(
      `${channel ? "✅" : "❌"} ${config.name} ${
        channel ? `(<#${channelId}>)` : "(Kurulmadı)"
      }`
    );
  }

  const shiftTagRole = guild.roles.cache.find(
    (r) => r.name === config.mesai.shiftTag
  );

  const embed = PremiumEmbed.primary(
    "📊 Kurulum Durumu",
    `**Sunucu:** ${guild.name}\n` +
      `**Kurulum Tarihi:** ${
        settings.setupDate
          ? new Date(settings.setupDate).toLocaleDateString("tr-TR")
          : "Kurulum yapılmamış"
      }\n` +
      `**Kurulum Yapan:** ${
        settings.setupBy ? `<@${settings.setupBy}>` : "Bilinmiyor"
      }\n\n` +
      `**🎭 Sistem Rolleri:**\n` +
      `${shiftTagRole ? "✅" : "❌"} [M] Mesai Tag\n\n` +
      `**📋 Log Kanalları:**\n${channels.join("\n")}`
  );

  await interaction.editReply({ embeds: [embed] });
}

// Yardımcı fonksiyonlar
function saveChannelId(guildId, category, channelId) {
  const key = `guild_settings_${guildId}`;
  const settings = db.get(key) || {};
  settings.channels = settings.channels || {};
  settings.channels[category] = channelId;
  db.set(key, settings);
}

function getGuildChannels(guildId) {
  const settings = db.get(`guild_settings_${guildId}`) || {};
  return settings.channels || {};
}
