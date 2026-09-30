/**
 * ═══════════════════════════════════════════════════════════════
 * 🚨 COMMAND: MESAI-PANEL - Modern Mesai Kontrol Paneli
 * ═══════════════════════════════════════════════════════════════
 * Referans görseldeki tasarım: Embed başlığı, butonlar, modern UI
 * ✅ Mesai Giriş | ❌ Mesai Çıkış | 👮 Mesai Kontrol
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { mesaiDB, logsDB } from "../db.js";
import { PremiumEmbed, formatTime, formatTurkishDate } from "../utils/embeds.js";
import { isUserInVoiceChannel, sendDMToUser } from "../utils/helpers.js";
import { createRoleWithRetry, discordRetry } from "../utils/retry.js";
import logger from "../utils/logger.js";
import config from "../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mesai-panel")
    .setDescription("Modern Mesai Kontrol Paneli oluştur")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addChannelOption((option) =>
      option
        .setName("kanal")
        .setDescription("Panelin gönderileceği kanal (boş bırakılırsa buraya gönderilir)")
        .setRequired(false)
    ),

  async execute(interaction, bot) {
    const targetChannel = interaction.options.getChannel("kanal") || interaction.channel;
    const guild = interaction.guild;
    const user = interaction.user;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // Aktif mesai sayısını al
      const activeUsers = mesaiDB.getActiveUsers(guild.id);
      const activeCount = activeUsers.length;

      // Modern Endüstriyel Embed
      const panelEmbed = new EmbedBuilder()
        .setColor(config.colorHex.dark)
        .setTitle("🚨 MESAI KONTROL PANELI")
        .setDescription(
          `**${guild.name}** Ekibinin Mesai Yönetim Sistemi\n\n` +
          `📊 **Güncel Durum:**\n` +
          `• Aktif Mesai: **${activeCount}** kişi\n` +
          `• Son Güncelleme: ${new Date().toLocaleTimeString("tr-TR")}\n\n` +
          `🔰 **Kullanım:**\n` +
          `Aşağıdaki butonları kullanarak mesai işlemlerinizi gerçekleştirin.`
        )
        .addFields(
          {
            name: "✅ Mesai Giriş",
            value: "Mesaia başlamak için tıklayın\n*(Ses kanalında olmanız gerekir)*",
            inline: true,
          },
          {
            name: "❌ Mesai Çıkış",
            value: "Mesainizi sonlandırmak için tıklayın\n*(Süre otomatik kaydedilir)*",
            inline: true,
          },
          {
            name: "👮 Mesai Kontrol",
            value: "Aktif mesai durumunuzu görüntüleyin\n*(Geçmiş ve süre bilgisi)*",
            inline: true,
          }
        )
        .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
        .setFooter({
          text: config.branding.signature,
          iconURL: null,
        })
        .setTimestamp();

      // Modern Buton Satırı
      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("mesai_giris")
          .setLabel("✅ Mesai Giriş")
          .setStyle(ButtonStyle.Success)
          .setEmoji("✅"),
        new ButtonBuilder()
          .setCustomId("mesai_cikis")
          .setLabel("❌ Mesai Çıkış")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("❌"),
        new ButtonBuilder()
          .setCustomId("mesai_kontrol")
          .setLabel("👮 Mesai Kontrol")
          .setStyle(ButtonStyle.Primary)
          .setEmoji("👮")
      );

      // İkinci buton satırı (Ekstra özellikler)
      const extraRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("mesai_aktifler")
          .setLabel(`👥 Aktif Memurlar (${activeCount})`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("👥"),
        new ButtonBuilder()
          .setCustomId("mesai_leaderboard")
          .setLabel("🏆 Leaderboard")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("🏆")
      );

      await targetChannel.send({
        embeds: [panelEmbed],
        components: [buttonRow, extraRow],
      });

      // Yanıt
      const successEmbed = PremiumEmbed.success(
        "✅ Panel Oluşturuldu",
        `Mesai Kontrol Paneli <#${targetChannel.id}> kanalına gönderildi.\n\n` +
          `**Panel Özellikleri:**\n` +
          `• ✅ Mesai Giriş (Yeşil)\n` +
          `• ❌ Mesai Çıkış (Kırmızı)\n` +
          `• 👮 Mesai Kontrol (Mavi)\n` +
          `• 👥 Aktif Memurlar Listesi\n` +
          `• 🏆 Leaderboard Erişimi`
      );

      await interaction.editReply({ embeds: [successEmbed] });

      // Log
      logsDB.addLog(
        guild.id,
        "settingChange",
        `${user.tag} mesai paneli oluşturdu (#${targetChannel.name})`,
        { userId: user.id, channelId: targetChannel.id }
      );

      logger.info(`[${guild.name}] ${user.tag} created mesai panel in #${targetChannel.name}`);
    } catch (error) {
      logger.error(`Mesai panel creation error: ${error.message}`, error);
      await interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            "❌ Panel Oluşturma Hatası",
            `Bir hata oluştu: \`${error.message}\``
          ),
        ],
      });
    }
  },
};

/**
 * ═══════════════════════════════════════════════════════════════
 * 🔘 BUTTON HANDLERS - Mesai Panel Buton İşleyicileri
 * ═══════════════════════════════════════════════════════════════
 * Bu fonksiyonlar bot.js'ten çağrılır
 */

/**
 * ✅ Mesai Giriş Butonu İşleyici
 */
export async function handleMesaiGiris(interaction, bot) {
  const user = interaction.user;
  const member = interaction.member;
  const guild = interaction.guild;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Kontrol 1: Zaten mesaide mi?
    const isAlreadyInShift = mesaiDB.isUserInShift(user.id, guild.id);
    if (isAlreadyInShift) {
      const currentShift = mesaiDB.getActiveUsers(guild.id).find(s => s.userId === user.id);
      const duration = currentShift ? Date.now() - currentShift.startTime : 0;
      
      return interaction.editReply({
        embeds: [
          PremiumEmbed.warning(
            "⚠️ Zaten Mesaidesiniz!",
            `**${user.username}**, zaten aktif bir mesainiz var.\n\n` +
              `⏱️ **Aktif Mesai Süresi:** ${formatTime(duration)}\n` +
              `🕐 **Başlangıç:** ${formatTurkishDate(currentShift?.startTime || Date.now())}\n\n` +
              `Mesaiden çıkmak için **❌ Mesai Çıkış** butonunu kullanın.`
          ),
        ],
      });
    }

    // Kontrol 2: Ses kanalında mı?
    if (config.mesai.voiceChannelRequired && !isUserInVoiceChannel(member)) {
      return interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            "❌ Ses Kanalı Gerekli!",
            `**${user.username}**, mesaia başlamak için bir ses kanalında olmalısınız!\n\n` +
              `Lütfen uygun ses kanalına katılın ve tekrar deneyin.`
          ),
        ],
      });
    }

    // Mesaia başla
    const startTime = mesaiDB.startShift(user.id, guild.id);

    // [M] Tag rolünü ekle
    if (config.mesai.shiftTag) {
      try {
        let shiftRole = guild.roles.cache.find((r) => r.name === config.mesai.shiftTag);
        if (!shiftRole) {
          // Retry mekanizması ile rol oluştur
          shiftRole = await createRoleWithRetry(guild, {
            name: config.mesai.shiftTag,
            color: config.colorHex.success,
            reason: "Mesai tag rolü",
          });
        }
        // Retry mekanizması ile rol ekle
        await discordRetry(
          () => member.roles.add(shiftRole),
          "Mesai tag rolü ekleme"
        );
      } catch (roleError) {
        logger.warn(`Failed to add shift tag: ${roleError.message}`);
      }
    }

    // Log kaydı
    logsDB.addLog(guild.id, "mesaiGiris", `${user.tag} mesai başlattı (Buton)`, {
      userId: user.id,
      startTime,
    });

    // Başarı mesajı
    const voiceChannel = member.voice.channel;
    const embed = PremiumEmbed.success(
      "✅ Mesai Başladı!",
      `Hoş geldin **${user.username}**! 🎯\n\n` +
        `**Mesainiz başarıyla başladı.**\n\n` +
        `📍 **Ses Kanalı:** ${voiceChannel ? voiceChannel.name : "Bilinmiyor"}\n` +
        `🕐 **Başlangıç:** ${formatTurkishDate(startTime)}\n` +
        `🏷️ **Tag:** [M] rolü verildi\n\n` +
        `⚠️ *Ses kanalından ayrılırsanız mesainiz otomatik olarak sona erer.*`
    );

    embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));

    await interaction.editReply({ embeds: [embed] });

    // DM bildirimi
    try {
      await sendDMToUser(user, {
        embeds: [embed],
      });
    } catch (dmError) {
      logger.debug(`DM gönderilemedi: ${user.tag}`);
    }

    logger.info(`[${guild.name}] ${user.tag} mesai başlattı (Buton)`);
  } catch (error) {
    logger.error(`Mesai giriş hatası: ${error.message}`, error);
    await interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Hata Oluştu",
          `Mesai başlatılırken bir hata oluştu: \`${error.message}\``
        ),
      ],
    });
  }
}

/**
 * ❌ Mesai Çıkış Butonu İşleyici
 */
export async function handleMesaiCikis(interaction, bot) {
  const user = interaction.user;
  const member = interaction.member;
  const guild = interaction.guild;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    // Kontrol: Mesaide mi?
    const isInShift = mesaiDB.isUserInShift(user.id, guild.id);
    if (!isInShift) {
      return interaction.editReply({
        embeds: [
          PremiumEmbed.warning(
            "⚠️ Mesaide Değilsiniz!",
            `**${user.username}**, şu anda aktif bir mesainiz bulunmuyor.\n\n` +
              `Mesaia başlamak için **✅ Mesai Giriş** butonunu kullanın.`
          ),
        ],
      });
    }

    // Mesaiden çık
    const shiftResult = mesaiDB.endShift(user.id, guild.id);
    if (!shiftResult) {
      return interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            "❌ Hata",
            "Mesai bilgisi alınamadı. Lütfen tekrar deneyin."
          ),
        ],
      });
    }

    const { duration, endTime } = shiftResult;
    const totalTime = mesaiDB.getUserTotalTime(user.id, guild.id);

    // [M] Tag rolünü kaldır
    if (config.mesai.shiftTag) {
      try {
        const shiftRole = guild.roles.cache.find((r) => r.name === config.mesai.shiftTag);
        if (shiftRole && member.roles.cache.has(shiftRole.id)) {
          // Retry mekanizması ile rol kaldır
          await discordRetry(
            () => member.roles.remove(shiftRole),
            "Mesai tag rolü kaldırma"
          );
        }
      } catch (roleError) {
        logger.warn(`Failed to remove shift tag: ${roleError.message}`);
      }
    }

    // Log kaydı
    logsDB.addLog(guild.id, "mesaiCikis", `${user.tag} mesai sonlandırdı (Buton)`, {
      userId: user.id,
      duration,
      endTime,
    });

    // Başarı mesajı
    const embed = PremiumEmbed.secondary(
      "❌ Mesai Sona Erdi",
      `**${user.username}**, mesainiz sona erdi. 👋\n\n` +
        `📊 **Mesai Özeti:**\n` +
        `• ⏱️ **Bu Mesai:** ${formatTime(duration)}\n` +
        `• 📈 **Toplam Mesai:** ${formatTime(totalTime)}\n` +
        `• 🕐 **Bitiş:** ${formatTurkishDate(endTime)}\n` +
        `• 🏷️ **Tag:** [M] rolü kaldırıldı\n\n` +
        `İyi dinlenmeler! 🎯`
    );

    embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
    embed.setColor(config.colorHex.secondary);

    await interaction.editReply({ embeds: [embed] });

    // DM bildirimi
    try {
      await sendDMToUser(user, {
        embeds: [embed],
      });
    } catch (dmError) {
      logger.debug(`DM gönderilemedi: ${user.tag}`);
    }

    logger.info(`[${guild.name}] ${user.tag} mesai sonlandırdı (Buton) - Süre: ${formatTime(duration)}`);
  } catch (error) {
    logger.error(`Mesai çıkış hatası: ${error.message}`, error);
    await interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Hata Oluştu",
          `Mesai sonlandırılırken bir hata oluştu: \`${error.message}\``
        ),
      ],
    });
  }
}

/**
 * 👮 Mesai Kontrol Butonu İşleyici
 */
export async function handleMesaiKontrol(interaction, bot) {
  const user = interaction.user;
  const guild = interaction.guild;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const isInShift = mesaiDB.isUserInShift(user.id, guild.id);
    const totalTime = mesaiDB.getUserTotalTime(user.id, guild.id);

    let statusText, statusEmoji, color;
    let currentDuration = 0;

    if (isInShift) {
      const currentShift = mesaiDB.getActiveUsers(guild.id).find(s => s.userId === user.id);
      currentDuration = currentShift ? Date.now() - currentShift.startTime : 0;
      statusText = "🟢 AKTIF MESAI";
      statusEmoji = "✅";
      color = config.colorHex.success;
    } else {
      statusText = "🔴 MESAIDE DEĞIL";
      statusEmoji = "❌";
      color = config.colorHex.error;
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`👮 MESAI KONTROL - ${user.username}`)
      .setDescription(
        `**Durum:** ${statusText}\n\n` +
          `📊 **İstatistikleriniz:**\n` +
          `• ⏱️ **Toplam Mesai:** ${formatTime(totalTime)}\n`
      )
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: config.branding.signature })
      .setTimestamp();

    if (isInShift && currentDuration > 0) {
      const currentShift = mesaiDB.getActiveUsers(guild.id).find(s => s.userId === user.id);
      embed.addFields(
        { name: "⏰ Aktif Mesai Süresi", value: formatTime(currentDuration), inline: true },
        { name: "🕐 Başlangıç", value: formatTurkishDate(currentShift?.startTime || Date.now()), inline: true },
        { name: "📍 Durum", value: "Mesaide aktifsiniz", inline: true }
      );
    } else {
      embed.addFields(
        { name: "📍 Durum", value: "Şu anda mesaide değilsiniz", inline: false },
        { name: "💡 İpucu", value: "Mesaia başlamak için **✅ Mesai Giriş** butonuna tıklayın", inline: false }
      );
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error(`Mesai kontrol hatası: ${error.message}`, error);
    await interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Hata Oluştu",
          `Kontrol sırasında bir hata oluştu: \`${error.message}\``
        ),
      ],
    });
  }
}

/**
 * 👥 Aktif Memurlar Butonu İşleyici
 */
export async function handleMesaiAktifler(interaction, bot) {
  const guild = interaction.guild;
  const user = interaction.user;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const activeUsers = mesaiDB.getActiveUsers(guild.id);

    if (activeUsers.length === 0) {
      return interaction.editReply({
        embeds: [
          PremiumEmbed.info(
            "👥 Aktif Memurlar",
            `Şu anda **${guild.name}** sunucusunda aktif mesai yapan memur bulunmuyor.`
          ),
        ],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colorHex.info)
      .setTitle(`👥 AKTIF MEMURLAR - ${guild.name}`)
      .setDescription(`Şu anda **${activeUsers.length}** memur aktif mesaide.`)
      .setFooter({ text: config.branding.signature })
      .setTimestamp();

    // Aktif kullanıcıları listele (max 10)
    const displayUsers = activeUsers.slice(0, 10);
    
    for (const shift of displayUsers) {
      const duration = Date.now() - shift.startTime;
      const member = await guild.members.fetch(shift.userId).catch(() => null);
      const userName = member?.user?.username || "Bilinmiyor";
      
      embed.addFields({
        name: `👤 ${userName}`,
        value: `⏱️ ${formatTime(duration)} • 🕐 ${formatTurkishDate(shift.startTime)}`,
        inline: false,
      });
    }

    if (activeUsers.length > 10) {
      embed.setDescription(
        `Şu anda **${activeUsers.length}** memur aktif mesaide.\n*(İlk 10 gösteriliyor)*`
      );
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error(`Aktif memurlar hatası: ${error.message}`, error);
    await interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Hata Oluştu",
          `Liste alınırken bir hata oluştu: \`${error.message}\``
        ),
      ],
    });
  }
}

/**
 * 🏆 Leaderboard Butonu İşleyici
 */
export async function handleMesaiLeaderboard(interaction, bot) {
  const { leaderboardDB } = await import("../db.js");
  const guild = interaction.guild;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const top10 = leaderboardDB.getTop10(guild.id);

    if (top10.data.length === 0) {
      return interaction.editReply({
        embeds: [
          PremiumEmbed.info(
            "🏆 Leaderboard",
            `Henüz kayıtlı mesai verisi bulunmuyor.\n\n` +
              `İlk mesainizi başlatarak liderlik tablosuna girebilirsiniz!`
          ),
        ],
      });
    }

    const embed = new EmbedBuilder()
      .setColor(config.colorHex.accent)
      .setTitle(`🏆 MESAI LEADERBOARD - ${guild.name}`)
      .setDescription("En çok mesai yapan top 10 memur")
      .setFooter({ text: config.branding.signature })
      .setTimestamp();

    top10.data.forEach((item, index) => {
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📊";
      embed.addFields({
        name: `${medal} #${index + 1} • Kullanıcı`,
        value: `<@${item.userId}>\n⏱️ ${formatTime(item.totalShiftTime)} • 📝 ${item.shiftsCompleted} mesai`,
        inline: false,
      });
    });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error(`Leaderboard hatası: ${error.message}`, error);
    await interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Hata Oluştu",
          `Leaderboard alınırken bir hata oluştu: \`${error.message}\``
        ),
      ],
    });
  }
}
