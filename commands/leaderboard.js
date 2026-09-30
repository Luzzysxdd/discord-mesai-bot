/**
 * ═══════════════════════════════════════════════════════════════
 * 📊 COMMAND: LEADERBOARD (Top Statistics with Pagination)
 * ═══════════════════════════════════════════════════════════════
 */

import { SlashCommandBuilder } from "discord.js";
import { leaderboardDB } from "../db.js";
import {
  leaderboardEmbeds,
  PremiumButtonRow,
  formatTime,
} from "../utils/embeds.js";
import logger from "../utils/logger.js";
import config from "../config.js";
import { ButtonStyle } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Ekibin mesai sıralamasını gör")
    .addIntegerOption((option) =>
      option
        .setName("sayfa")
        .setDescription("Görüntülenecek sayfa numarası")
        .setMinValue(1)
        .setRequired(false)
    )
    .setDMPermission(false),

  async execute(interaction, bot) {
    await interaction.deferReply({ ephemeral: false });

    const guild = interaction.guild;
    const user = interaction.user;
    const pageNumber = interaction.options.getInteger("sayfa") || 1;

    try {
      // ═══ GET LEADERBOARD DATA ═══
      const leaderboard = leaderboardDB.getLeaderboard(
        guild.id,
        pageNumber,
        10 // 10 users per page
      );

      if (leaderboard.data.length === 0) {
        return interaction.editReply({
          embeds: [
            leaderboardEmbeds.topList(
              [],
              pageNumber,
              leaderboard.totalPages
            ),
          ],
        });
      }

      // ═══ BUILD EMBED WITH PAGINATION ═══
      const embed = leaderboardEmbeds.topList(
        leaderboard.data,
        pageNumber,
        leaderboard.totalPages
      );

      // ═══ ADD NAVIGATION BUTTONS ═══
      const buttonRow = new PremiumButtonRow();

      if (pageNumber > 1) {
        buttonRow.addSecondaryButton(
          `leaderboard_prev_${pageNumber}`,
          "⬅️ Önceki"
        );
      }

      buttonRow.addButton(
        `leaderboard_jump_${pageNumber}`,
        `📄 Sayfa ${pageNumber}/${leaderboard.totalPages}`,
        ButtonStyle.Primary,
        "📊"
      );

      if (pageNumber < leaderboard.totalPages) {
        buttonRow.addSecondaryButton(
          `leaderboard_next_${pageNumber}`,
          "Sonraki ➡️"
        );
      }

      const buttons = buttonRow.buildSingle();

      // ═══ SEND RESPONSE ═══
      const message = await interaction.editReply({
        embeds: [embed],
        components: buttons ? [buttons] : [],
      });

      // ═══ HANDLE PAGINATION ═══
      const collector = message.createMessageComponentCollector(
        {
          time: 120000, // 2 minutes
        }
      );

      collector.on("collect", async (btnInteraction) => {
        // Permission check
        if (btnInteraction.user.id !== user.id) {
          return btnInteraction.reply({
            content: `${config.interactions.emojis.error} Bu butonları sadece komut yayıncısı kullanabilir!`,
            ephemeral: true,
          });
        }

        let nextPage = pageNumber;

        if (
          btnInteraction.customId.startsWith(
            "leaderboard_prev_"
          )
        ) {
          nextPage = Math.max(1, pageNumber - 1);
        } else if (
          btnInteraction.customId.startsWith(
            "leaderboard_next_"
          )
        ) {
          nextPage = Math.min(
            leaderboard.totalPages,
            pageNumber + 1
          );
        }

        // Fetch new page
        const newLeaderboard =
          leaderboardDB.getLeaderboard(
            guild.id,
            nextPage,
            10
          );

        const newEmbed = leaderboardEmbeds.topList(
          newLeaderboard.data,
          nextPage,
          newLeaderboard.totalPages
        );

        // Build new buttons
        const newButtonRow = new PremiumButtonRow();

        if (nextPage > 1) {
          newButtonRow.addSecondaryButton(
            `leaderboard_prev_${nextPage}`,
            "⬅️ Önceki"
          );
        }

        newButtonRow.addButton(
          `leaderboard_jump_${nextPage}`,
          `📄 Sayfa ${nextPage}/${newLeaderboard.totalPages}`,
          ButtonStyle.Primary,
          "📊"
        );

        if (nextPage < newLeaderboard.totalPages) {
          newButtonRow.addSecondaryButton(
            `leaderboard_next_${nextPage}`,
            "Sonraki ➡️"
          );
        }

        const newButtons = newButtonRow.buildSingle();

        await btnInteraction.update({
          embeds: [newEmbed],
          components: newButtons ? [newButtons] : [],
        });

        logger.debug(
          `[${guild.name}] User ${user.tag} navigated to leaderboard page ${nextPage}`
        );
      });

      collector.on("end", () => {
        logger.debug("Leaderboard pagination ended");
      });
    } catch (error) {
      logger.error(`Error in leaderboard command:`, error);

      const { PremiumEmbed } = await import(
        "../utils/embeds.js"
      );

      await interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            `${config.interactions.emojis.error} HATA OLUŞTU!`,
            `
Leaderboard yüklenirken hata oluştu.

**Hata:** ${error.message}
            `
          ),
        ],
      });
    }
  },
};
