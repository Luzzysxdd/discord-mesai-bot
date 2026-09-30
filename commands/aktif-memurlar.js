/**
 * ═══════════════════════════════════════════════════════════════
 * 👥 COMMAND: AKTIF-MEMURLAR (Active Members)
 * ═══════════════════════════════════════════════════════════════
 */

import { SlashCommandBuilder } from "discord.js";
import { mesaiDB, logsDB } from "../db.js";
import {
  PremiumEmbed,
  PremiumButtonRow,
  formatTime,
} from "../utils/embeds.js";
import logger from "../utils/logger.js";
import config from "../config.js";
import {
  isAdmin,
  hasPermission,
} from "../utils/helpers.js";
import { ButtonStyle } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("aktif-memurlar")
    .setDescription("Şu anda mesaideki tüm memurları listele")
    .setDMPermission(false),

  async execute(interaction, bot) {
    await interaction.deferReply({ ephemeral: false });

    const guild = interaction.guild;
    const user = interaction.user;
    const member = interaction.member;

    try {
      // ═══ GET ACTIVE USERS ═══
      const activeUsers = mesaiDB.getActiveUsers(guild.id);

      if (activeUsers.length === 0) {
        return interaction.editReply({
          embeds: [
            PremiumEmbed.info(
              `${config.interactions.emojis.users} AKTIF MEMURLLAR`,
              `
Şu anda mesaideki memurllar:

**Toplam:** 0 kişi

*Kimse henüz mesaia başlamadı.*
              `
            ),
          ],
        });
      }

      // ═══ BUILD EMBED ═══
      const embed = new PremiumEmbed(
        `${config.interactions.emojis.users} AKTIF MEMURLLAR`,
        `
Şu anda mesaideki memurllar:

**Toplam:** ${activeUsers.length} kişi
      `
      );

      // Add fields for each active user
      for (const shift of activeUsers) {
        try {
          const shiftMember = await guild.members.fetch(
            shift.userId
          );

          const duration = Date.now() - shift.startTime;
          const durationStr = formatTime(duration);

          embed.addFields({
            name: `👤 ${shiftMember.user.username}`,
            value: `⏱️ ${durationStr}`,
            inline: true,
          });
        } catch (error) {
          logger.debug(
            `Failed to fetch member ${shift.userId}`
          );
        }
      }

      // ═══ ADD ACTION BUTTONS ═══
      const buttonRow = new PremiumButtonRow();

      buttonRow.addButton(
        "refresh_active",
        "🔄 Yenile",
        ButtonStyle.Secondary
      );

      // If user is admin, add "Toplu Mesai Bitir" button
      if (
        isAdmin(member, process.env.OWNER_IDS?.split(",")[0])
      ) {
        buttonRow.addDangerButton(
          "bulk_end_shifts",
          "🛑 Toplu Mesai Bitir"
        );
      }

      const buttons = buttonRow.buildSingle();

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
        // Permission check
        if (btnInteraction.user.id !== user.id) {
          return btnInteraction.reply({
            content: `${config.interactions.emojis.error} Bu butonu sadece komut yayıncısı kullanabilir!`,
            ephemeral: true,
          });
        }

        if (btnInteraction.customId === "refresh_active") {
          // Refresh the list
          const updatedUsers = mesaiDB.getActiveUsers(
            guild.id
          );

          if (updatedUsers.length === 0) {
            return btnInteraction.reply({
              embeds: [
                PremiumEmbed.info(
                  `${config.interactions.emojis.users} AKTIF MEMURLLAR`,
                  "*Kimse mesaide değil.*"
                ),
              ],
              ephemeral: true,
            });
          }

          const updatedEmbed = new PremiumEmbed(
            `${config.interactions.emojis.users} AKTIF MEMURLLAR (Yenilendi)`,
            `**Toplam:** ${updatedUsers.length} kişi`
          );

          for (const shift of updatedUsers) {
            try {
              const shiftMember = await guild.members.fetch(
                shift.userId
              );
              const duration =
                Date.now() - shift.startTime;
              updatedEmbed.addFields({
                name: `👤 ${shiftMember.user.username}`,
                value: `⏱️ ${formatTime(duration)}`,
                inline: true,
              });
            } catch (e) {
              logger.debug("Failed to fetch member");
            }
          }

          btnInteraction.reply({
            embeds: [updatedEmbed],
            ephemeral: true,
          });
        }

        if (
          btnInteraction.customId === "bulk_end_shifts"
        ) {
          // Confirm bulk end
          const confirmRow = new PremiumButtonRow()
            .addSuccessButton(
              "confirm_bulk_end",
              "✅ Onayla"
            )
            .addDangerButton(
              "cancel_bulk_end",
              "❌ İptal"
            )
            .buildSingle();

          const confirmMsg = await btnInteraction.reply({
            embeds: [
              PremiumEmbed.warning(
                `${config.interactions.emojis.warning} ONAY GEREKLİ`,
                `
Tüm active mesaiları bitirmek istediğinden emin misin?
              `
              ),
            ],
            components: [confirmRow],
            ephemeral: true,
          });

          const confirmCollector =
            confirmMsg.createMessageComponentCollector({
              time: 30000,
            });

          confirmCollector.on("collect", async (confirmBtn) => {
            if (
              confirmBtn.customId ===
              "confirm_bulk_end"
            ) {
              // End all shifts
              const allActive = mesaiDB.getActiveUsers(
                guild.id
              );
              let endedCount = 0;

              for (const shift of allActive) {
                try {
                  mesaiDB.endShift(shift.userId, guild.id);
                  endedCount++;

                  // Remove tag
                  try {
                    const shiftMember =
                      await guild.members.fetch(
                        shift.userId
                      );
                    const shiftRole =
                      guild.roles.cache.find(
                        (r) =>
                          r.name ===
                          config.mesai.shiftTag
                      );
                    if (
                      shiftRole &&
                      shiftMember.roles.cache.has(
                        shiftRole.id
                      )
                    ) {
                      await shiftMember.roles.remove(
                        shiftRole
                      );
                    }
                  } catch (e) {
                    logger.debug(
                      "Failed to remove shift tag"
                    );
                  }
                } catch (e) {
                  logger.error(
                    "Failed to end shift:",
                    e
                  );
                }
              }

              logsDB.addLog(
                guild.id,
                "mesaiCikis",
                `Admin ${user.tag} ended all shifts (${endedCount} users)`,
                { count: endedCount, adminId: user.id }
              );

              confirmBtn.reply({
                embeds: [
                  PremiumEmbed.success(
                    `${config.interactions.emojis.success} TAMAMLANDI`,
                    `
**${endedCount}** memurun mesaisi sona erdirildi.
                  `
                  ),
                ],
                ephemeral: true,
              });

              logger.info(
                `[${guild.name}] Admin ${user.tag} ended ${endedCount} shifts`
              );
            } else if (
              confirmBtn.customId === "cancel_bulk_end"
            ) {
              confirmBtn.reply({
                embeds: [
                  PremiumEmbed.info(
                    "İptal Edildi",
                    "İşlem iptal edilmiştir."
                  ),
                ],
                ephemeral: true,
              });
            }
          });
        }
      });

      collector.on("end", () => {
        // Buttons expire after 1 minute
        logger.debug("Active members list button collector ended");
      });
    } catch (error) {
      logger.error(
        `Error in aktif-memurlar command:`,
        error
      );

      await interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            `${config.interactions.emojis.error} HATA OLUŞTU!`,
            `
Aktif memurlar listelenirken hata oluştu.

**Hata:** ${error.message}
            `
          ),
        ],
      });
    }
  },
};
