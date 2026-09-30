/**
 * ═══════════════════════════════════════════════════════════════
 * ✅ COMMAND: MESAI-CIK (End Shift)
 * ═══════════════════════════════════════════════════════════════
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { mesaiDB, logsDB } from "../db.js";
import {
  mesaiEmbeds,
  PremiumEmbed,
  formatTime,
} from "../utils/embeds.js";
import { discordRetry } from "../utils/retry.js";
import logger from "../utils/logger.js";
import config from "../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mesai-cik")
    .setDescription("Mesaini bitir ve çık")
    .setDMPermission(false),

  async execute(interaction, bot) {
    await interaction.deferReply({ ephemeral: false });

    const user = interaction.user;
    const member = interaction.member;
    const guild = interaction.guild;

    try {
      // ═══ CHECK 1: IN SHIFT? ═══
      const isInShift = mesaiDB.isUserInShift(
        user.id,
        guild.id
      );

      if (!isInShift) {
        return interaction.editReply({
          embeds: [
            PremiumEmbed.warning(
              `${config.interactions.emojis.warning} MESAIDE DEĞİLSİN!`,
              `
**${user.username}** Şu anda mesaide değilsin.

Mesaia başlamak için: \`/mesai-gir\`
              `
            ),
          ],
        });
      }

      // ═══ END SHIFT ═══
      const shiftResult = mesaiDB.endShift(
        user.id,
        guild.id
      );

      if (!shiftResult) {
        return interaction.editReply({
          embeds: [
            PremiumEmbed.error(
              `${config.interactions.emojis.error} HATA!`,
              "Mesai bilgisi alınamadı."
            ),
          ],
        });
      }

      const { duration, endTime } = shiftResult;

      // ═══ REMOVE SHIFT TAG (ROLE) ═══
      if (config.mesai.shiftTag) {
        try {
          const shiftRole = guild.roles.cache.find(
            (r) => r.name === config.mesai.shiftTag
          );

          if (shiftRole && member.roles.cache.has(shiftRole.id)) {
            // Retry mekanizması ile rol kaldır
            await discordRetry(
              () => member.roles.remove(shiftRole),
              "Mesai tag rolü kaldırma"
            );
          }
        } catch (roleError) {
          logger.warn(
            `Failed to remove shift tag from ${user.tag}:`,
            roleError
          );
        }
      }

      // ═══ LOG ═══
      logsDB.addLog(
        guild.id,
        "mesaiCikis",
        `${user.tag} ended shift (Duration: ${formatTime(duration)})`,
        {
          userId: user.id,
          duration,
          endTime,
        }
      );

      // ═══ SEND RESPONSE ═══
      const totalTime = mesaiDB.getUserTotalTime(
        user.id,
        guild.id
      );

      const endEmbed = mesaiEmbeds.shiftEnded(
        user,
        duration,
        totalTime
      );

      await interaction.editReply({
        embeds: [endEmbed],
      });

      logger.info(
        `[${guild.name}] ${user.tag} ended shift (${formatTime(duration)})`
      );
    } catch (error) {
      logger.error(
        `Error in mesai-cik command for ${user.tag}:`,
        error
      );

      await interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            `${config.interactions.emojis.error} HATA OLUŞTU!`,
            `
Mesaiden çıkarken bir hata oluştu.

**Hata:** ${error.message}

Lütfen yöneticiye bildir.
            `
          ),
        ],
      });
    }
  },
};
