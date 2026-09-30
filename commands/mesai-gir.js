/**
 * ═══════════════════════════════════════════════════════════════
 * ✅ COMMAND: MESAI-GIR (Start Shift)
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
import {
  isUserInVoiceChannel,
  hasRole,
  sendDMToUser,
} from "../utils/helpers.js";
import { createRoleWithRetry, discordRetry } from "../utils/retry.js";
import logger from "../utils/logger.js";
import config from "../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mesai-gir")
    .setDescription("Mesaia başla ve etkinliğe katıl")
    .setDMPermission(false),

  async execute(interaction, bot) {
    await interaction.deferReply({ ephemeral: false });

    const user = interaction.user;
    const member = interaction.member;
    const guild = interaction.guild;

    try {
      // ═══ CHECK 1: ALREADY IN SHIFT? ═══
      const isAlreadyInShift = mesaiDB.isUserInShift(
        user.id,
        guild.id
      );

      if (isAlreadyInShift) {
        const userStats = await getUserStats(user.id, guild.id);
        return interaction.editReply({
          embeds: [
            PremiumEmbed.warning(
              `${config.interactions.emojis.warning} ZATEN MESAIDEYIZ!`,
              `
**${user.username}** Zaten mesaideysin!

**Aktif Mesai Süresi:** ${formatTime(
                userStats.totalShiftTime
              )}
**Toplam Mesai:** ${formatTime(userStats.totalShiftTime)}

Mesaiden çıkmak için: \`/mesai-cik\`
              `
            ),
          ],
        });
      }

      // ═══ CHECK 2: IN VOICE CHANNEL? ═══
      if (config.mesai.voiceChannelRequired) {
        if (!isUserInVoiceChannel(member)) {
          return interaction.editReply({
            embeds: [
              PremiumEmbed.error(
                `${config.interactions.emojis.error} SES KANAL GEREKLI!`,
                `
**${user.username}** Mesaia başlamak için bir ses kanalında olmalısın!

Lütfen gerekli ses kanalına katıl ve tekrar dene.
              `
              ),
            ],
          });
        }
      }

      // ═══ START SHIFT ═══
      const startTime = mesaiDB.startShift(
        user.id,
        guild.id
      );

      // ═══ ADD SHIFT TAG (ROLE) ═══
      if (config.mesai.shiftTag) {
        try {
          let shiftRole = guild.roles.cache.find(
            (r) => r.name === config.mesai.shiftTag
          );

          if (!shiftRole) {
            // Retry mekanizması ile rol oluştur
            shiftRole = await createRoleWithRetry(guild, {
              name: config.mesai.shiftTag,
              color: config.colors.primary,
              reason: "Mesai tag role",
            });
            logger.info(
              `[${guild.name}] Created shift tag role: ${config.mesai.shiftTag}`
            );
          }

          // Retry mekanizması ile rol ekle
          await discordRetry(
            () => member.roles.add(shiftRole),
            "Mesai tag rolü ekleme"
          );
        } catch (roleError) {
          logger.warn(
            `Failed to add shift tag role to ${user.tag}:`,
            roleError
          );
        }
      }

      // ═══ LOG ═══
      logsDB.addLog(
        guild.id,
        "mesaiGiris",
        `${user.tag} started shift`,
        {
          userId: user.id,
          timestamp: startTime,
        }
      );

      // ═══ SEND RESPONSES ═══
      const successEmbed = mesaiEmbeds.shiftStarted(user);

      await interaction.editReply({
        embeds: [successEmbed],
      });

      logger.info(
        `[${guild.name}] ${user.tag} started shift`
      );

      // Optional: Announce to a specific channel
      // const announcementChannel = guild.channels.cache.find(
      //   (c) => c.name === "mesai-duyurular"
      // );
      // if (announcementChannel) {
      //   await announcementChannel.send({
      //     embeds: [successEmbed],
      //   });
      // }
    } catch (error) {
      logger.error(
        `Error in mesai-gir command for ${user.tag}:`,
        error
      );

      await interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            `${config.interactions.emojis.error} HATA OLUŞTU!`,
            `
Mesaia başlarken bir hata oluştu.

**Hata:** ${error.message}

Lütfen yöneticiye bildir.
            `
          ),
        ],
      });
    }
  },
};

/**
 * Helper function to get user stats
 */
async function getUserStats(userId, guildId) {
  const stats = {
    totalShiftTime: 0,
    shiftsCompleted: 0,
    lastShiftTime: 0,
  };

  return stats;
}
