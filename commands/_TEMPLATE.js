/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 EXAMPLE: Custom Command Template
 * ═══════════════════════════════════════════════════════════════
 * Use this as a template to create new commands
 */

import { SlashCommandBuilder } from "discord.js";
import logger from "../utils/logger.js";
import {
  PremiumEmbed,
  PremiumButtonRow,
} from "../utils/embeds.js";
import config from "../config.js";
import { hasPermission } from "../utils/helpers.js";

export default {
  // Command definition
  data: new SlashCommandBuilder()
    .setName("template-komut")
    .setDescription("Bu, bir şablon komutudur")
    .addStringOption((option) =>
      option
        .setName("parametre")
        .setDescription("Bir parametre örneği")
        .setRequired(true)
    )
    .setDMPermission(false),

  // Command execution
  async execute(interaction, bot) {
    // Defer reply (bot şu anda "düşünüyor")
    await interaction.deferReply({ ephemeral: false });

    // Get parameters and guild info
    const parameter = interaction.options.getString("parametre");
    const guild = interaction.guild;
    const user = interaction.user;
    const member = interaction.member;

    try {
      // ═══ PERMISSION CHECK ═══
      if (!hasPermission(member, "operator")) {
        return interaction.editReply({
          embeds: [
            PremiumEmbed.error(
              `${config.interactions.emojis.error} YETKİ YOK!`,
              "Bu komutu kullanmak için 'Operatör' rolü gereklidir."
            ),
          ],
        });
      }

      // ═══ MAIN LOGIC ═══
      // Your command logic here
      logger.info(
        `[${guild.name}] ${user.tag} used template-komut`
      );

      // ═══ BUILD RESPONSE ═══
      const embed = PremiumEmbed.success(
        "✅ BAŞARILI",
        `
**Kullanıcı:** ${user}
**Parametre:** ${parameter}

Komut başarıyla çalıştırıldı!
        `
      );

      // ═══ ADD BUTTONS (optional) ═══
      const buttons = new PremiumButtonRow()
        .addSuccessButton("button_1", "✅ Onayla")
        .addDangerButton("button_2", "❌ İptal")
        .buildSingle();

      // ═══ SEND RESPONSE ═══
      const message = await interaction.editReply({
        embeds: [embed],
        components: buttons ? [buttons] : [],
      });

      // ═══ HANDLE BUTTON INTERACTIONS ═══
      const collector = message.createMessageComponentCollector(
        {
          time: 60000, // 1 minute
        }
      );

      collector.on("collect", async (btnInteraction) => {
        // Check if button presser is the same user who ran the command
        if (btnInteraction.user.id !== user.id) {
          return btnInteraction.reply({
            content: `${config.interactions.emojis.error} Sadece komut yayıncısı butonları kullanabilir!`,
            ephemeral: true,
          });
        }

        if (btnInteraction.customId === "button_1") {
          // Handle first button
          btnInteraction.reply({
            embeds: [
              PremiumEmbed.success(
                "✅ ONAYLANDI",
                "İşlem tamamlandı!"
              ),
            ],
            ephemeral: true,
          });
        } else if (btnInteraction.customId === "button_2") {
          // Handle second button
          btnInteraction.reply({
            embeds: [
              PremiumEmbed.warning(
                "⚠️ İPTAL EDİLDİ",
                "İşlem iptal edilmiştir."
              ),
            ],
            ephemeral: true,
          });
        }
      });

      collector.on("end", () => {
        logger.debug("Button collector ended");
      });
    } catch (error) {
      // ═══ ERROR HANDLING ═══
      logger.error(
        `Error in template-komut for ${user.tag}:`,
        error
      );

      await interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            `${config.interactions.emojis.error} HATA OLUŞTU!`,
            `
Komut çalıştırılırken hata oluştu.

**Hata:** ${error.message}

Lütfen yöneticiye bildir.
            `
          ),
        ],
      });
    }
  },
};
