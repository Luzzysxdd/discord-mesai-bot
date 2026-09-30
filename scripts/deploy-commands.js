/**
 * ═══════════════════════════════════════════════════════════════
 * 🚀 DEPLOY COMMANDS SCRIPT
 * ═══════════════════════════════════════════════════════════════
 * Run: node scripts/deploy-commands.js
 */

import { REST, Routes } from "discord.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function deployCommands() {
  console.log("🚀 Starting command deployment...");

  const commands = [];
  const commandsPath = join(__dirname, "..", "commands");

  // Get all command files
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  console.log(`📁 Found ${commandFiles.length} command files`);

  // Load all commands
  for (const file of commandFiles) {
    try {
      const filePath = join(commandsPath, file);
      const command = (await import(`file://${filePath}`)).default;

      if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded: ${command.data.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load ${file}:`, error.message);
    }
  }

  console.log(`\n📊 Total commands to deploy: ${commands.length}`);

  // Deploy to Discord
  try {
    const rest = new REST({ version: "10" }).setToken(
      process.env.DISCORD_TOKEN
    );

    console.log("\n⏳ Registering commands to Discord...");

    const result = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID || ""),
      { body: commands }
    );

    console.log(`\n✅ Successfully deployed ${result.length} commands!`);
    console.log("🎉 All commands are now live!\n");
  } catch (error) {
    console.error("❌ Failed to deploy commands:", error);
    process.exit(1);
  }
}

deployCommands();
