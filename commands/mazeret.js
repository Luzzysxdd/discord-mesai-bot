/**
 * ═══════════════════════════════════════════════════════════════
 * 📝 COMMAND: MAZERET - Gelişmiş Mazeret Bildirim Sistemi
 * ═══════════════════════════════════════════════════════════════
 * Modal (Form) ile mazeret bildirimi
 * Tarih/Saat seçimi, detaylı sebep, süre belirleme
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { db, excuseDB, logsDB } from "../db.js";
import { PremiumEmbed, formatTurkishDate } from "../utils/embeds.js";
import { isAdmin } from "../utils/helpers.js";
import logger from "../utils/logger.js";
import config from "../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("mazeret")
    .setDescription("Mazeret bildirim sistemi")
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("bildir")
        .setDescription("Yeni mazeret bildirimi oluştur (Form açılır)")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("panel")
        .setDescription("Mazeret bildirim paneli oluştur (Kalıcı buton)")
        .addChannelOption((option) =>
          option
            .setName("kanal")
            .setDescription("Panelin gönderileceği kanal")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("listele")
        .setDescription("Mazeretlerinizi listele")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("incele")
        .setDescription("Mazeret incele (Yönetici)")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("Mazeret ID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("durum")
        .setDescription("Mazeret durumunu güncelle (Yönetici)")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("Mazeret ID")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("karar")
            .setDescription("Karar")
            .setRequired(true)
            .addChoices(
              { name: "✅ Onayla", value: "approved" },
              { name: "❌ Reddet", value: "rejected" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("aciklama")
            .setDescription("Karar açıklaması")
            .setRequired(false)
        )
    ),

  async execute(interaction, bot) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const user = interaction.user;
    const member = interaction.member;

    try {
      switch (subcommand) {
        case "bildir":
          await handleMazeretModal(interaction);
          break;
        case "panel":
          await handleMazeretPanel(interaction, guild, user);
          break;
        case "listele":
          await handleMazeretList(interaction, guild, user);
          break;
        case "incele":
          await handleMazeretReview(interaction, guild, user, member);
          break;
        case "durum":
          await handleMazeretStatus(interaction, guild, user, member);
          break;
        default:
          await interaction.reply({
            embeds: [PremiumEmbed.error("❌ Hata", "Bilinmeyen alt komut.")],
            flags: MessageFlags.Ephemeral,
          });
      }
    } catch (error) {
      logger.error(`Mazeret command error: ${error.message}`, error);
      
      const replyMethod = interaction.deferred || interaction.replied 
        ? interaction.editReply 
        : interaction.reply;
        
      await replyMethod.call(interaction, {
        embeds: [
          PremiumEmbed.error(
            "❌ Hata Oluştu",
            `Bir hata oluştu: \`${error.message}\``
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

/**
 * 📝 Mazeret Modalını Aç
 */
async function handleMazeretModal(interaction) {
  // Modal oluştur
  const modal = new ModalBuilder()
    .setCustomId("mazeret_modal_submit")
    .setTitle("📝 Mazeret Bildirim Formu");

  // Mazeret Sebebi Input
  const sebepInput = new TextInputBuilder()
    .setCustomId("mazeret_sebep")
    .setLabel("📝 Mazeret Sebebi (Detaylı)")
    .setPlaceholder("Mazeretinizin detaylı açıklamasını yazın...")
    .setStyle(TextInputStyle.Paragraph)
    .setMinLength(10)
    .setMaxLength(500)
    .setRequired(true);

  // Başlangıç Tarihi Input
  const baslangicInput = new TextInputBuilder()
    .setCustomId("mazeret_baslangic")
    .setLabel("📅 Başlangıç Tarihi/Saati")
    .setPlaceholder("Örn: 25.04.2025 09:00 veya Bugün 14:00")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(50)
    .setRequired(true);

  // Süre Input
  const sureInput = new TextInputBuilder()
    .setCustomId("mazeret_sure")
    .setLabel("⏱️ Mazeret Süresi")
    .setPlaceholder("Örn: 3 gün, 48 saat, 1 hafta...")
    .setStyle(TextInputStyle.Short)
    .setMaxLength(50)
    .setRequired(true);

  // Ek Bilgi Input (Opsiyonel)
  const ekInput = new TextInputBuilder()
    .setCustomId("mazeret_ek")
    .setLabel("📎 Ek Bilgi (Opsiyonel)")
    .setPlaceholder("Varsa eklemek istediğiniz bilgiler...")
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(200)
    .setRequired(false);

  // Action Rows
  const row1 = new ActionRowBuilder().addComponents(sebepInput);
  const row2 = new ActionRowBuilder().addComponents(baslangicInput);
  const row3 = new ActionRowBuilder().addComponents(sureInput);
  const row4 = new ActionRowBuilder().addComponents(ekInput);

  modal.addComponents(row1, row2, row3, row4);

  // Modal'ı göster
  await interaction.showModal(modal);
}

/**
 * 📋 Mazeret Paneli Oluştur (Kalıcı buton)
 */
async function handleMazeretPanel(interaction, guild, user) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetChannel = interaction.options.getChannel("kanal") || interaction.channel;

  const panelEmbed = new EmbedBuilder()
    .setColor(config.colorHex.secondary)
    .setTitle("📝 MAZERET BILDIRIM PANELI")
    .setDescription(
      `**${guild.name}** Mazeret Bildirim Sistemi\n\n` +
        `📋 **Nasıl Kullanılır?**\n` +
        `Aşağıdaki butona tıklayarak mazeret formunu doldurun.\n\n` +
        `📝 **Formda İstenecekler:**\n` +
        `• Mazeret sebebi (detaylı)\n` +
        `• Başlangıç tarihi/saati\n` +
        `• Mazeret süresi\n` +
        `• Ek bilgiler (opsiyonel)\n\n` +
        `⏱️ **İşlem Süresi:** Form onaylandığında yetkililere iletilir.`
    )
    .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
    .setFooter({ text: config.branding.signature })
    .setTimestamp();

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mazeret_open_modal")
      .setLabel("📝 Mazeret Bildir")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("mazeret_listele")
      .setLabel("📋 Mazeretlerim")
      .setStyle(ButtonStyle.Secondary)
  );

  await targetChannel.send({
    embeds: [panelEmbed],
    components: [buttonRow],
  });

  const successEmbed = PremiumEmbed.success(
    "✅ Panel Oluşturuldu",
    `Mazeret Bildirim Paneli <#${targetChannel.id}> kanalına gönderildi.`
  );

  await interaction.editReply({ embeds: [successEmbed] });

  logger.info(`[${guild.name}] ${user.tag} mazeret paneli oluşturdu`);
}

/**
 * 📋 Kullanıcının Mazeretlerini Listele
 */
async function handleMazeretList(interaction, guild, user) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const excuses = excuseDB.getUserExcuses(user.id, guild.id);

  if (excuses.length === 0) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.info(
          "📋 Mazeretleriniz",
          `Henüz kayıtlı mazeretiniz bulunmuyor.\n\n` +
            `Mazeret bildirmek için \`/mazeret bildir\` komutunu kullanın.`
        ),
      ],
    });
  }

  const embed = new EmbedBuilder()
    .setColor(config.colorHex.info)
    .setTitle(`📋 ${user.username} - Mazeret Geçmişi`)
    .setDescription(`Toplam **${excuses.length}** mazeret kaydı bulundu.`)
    .setFooter({ text: config.branding.signature })
    .setTimestamp();

  // Son 10 mazereti göster
  const recentExcuses = excuses.slice(-10).reverse();

  for (const excuse of recentExcuses) {
    const statusEmoji =
      excuse.status === "pending"
        ? "⏳"
        : excuse.status === "approved"
        ? "✅"
        : excuse.status === "rejected"
        ? "❌"
        : "⚪";

    const statusText =
      excuse.status === "pending"
        ? "Beklemede"
        : excuse.status === "approved"
        ? "Onaylandı"
        : excuse.status === "rejected"
        ? "Reddedildi"
        : "Bilinmiyor";

    embed.addFields({
      name: `${statusEmoji} ${statusText} • ${formatTurkishDate(excuse.createdAt)}`,
      value: `**ID:** \`${excuse.id}\`\n**Sebep:** ${excuse.reason.substring(0, 50)}${
        excuse.reason.length > 50 ? "..." : ""
      }`,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

/**
 * 🔍 Mazeret İncele (Yönetici)
 */
async function handleMazeretReview(interaction, guild, user, member) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Yetki kontrolü
  if (!isAdmin(member, guild.ownerId)) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Yetki Hatası",
          "Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız."
        ),
      ],
    });
  }

  const excuseId = interaction.options.getString("id");
  const excuse = excuseDB.getExcuse(excuseId);

  if (!excuse) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Mazeret Bulunamadı",
          `\`${excuseId}\` ID'li mazeret kaydı bulunamadı.`
        ),
      ],
    });
  }

  const statusEmoji =
    excuse.status === "pending"
      ? "⏳"
      : excuse.status === "approved"
      ? "✅"
      : excuse.status === "rejected"
      ? "❌"
      : "⚪";

  const embed = new EmbedBuilder()
    .setColor(
      excuse.status === "approved"
        ? config.colorHex.success
        : excuse.status === "rejected"
        ? config.colorHex.error
        : config.colorHex.warning
    )
    .setTitle(`📋 MAZERET DETAY - ${excuse.id}`)
    .addFields(
      { name: "👤 Kullanıcı", value: `<@${excuse.userId}>`, inline: true },
      { name: "📊 Durum", value: `${statusEmoji} ${excuse.status.toUpperCase()}`, inline: true },
      { name: "🕐 Tarih", value: formatTurkishDate(excuse.createdAt), inline: true },
      { name: "📝 Sebep", value: excuse.reason, inline: false }
    )
    .setFooter({ text: config.branding.signature })
    .setTimestamp();

  if (excuse.reviewedBy) {
    embed.addFields({
      name: "👮 İnceleyen",
      value: `<@${excuse.reviewedBy}> • ${formatTurkishDate(excuse.reviewedAt)}`,
      inline: false,
    });
  }

  if (excuse.decision) {
    embed.addFields({
      name: "📌 Karar",
      value: excuse.decision,
      inline: false,
    });
  }

  await interaction.editReply({ embeds: [embed] });
}

/**
 * 🔄 Mazeret Durum Güncelle (Yönetici)
 */
async function handleMazeretStatus(interaction, guild, user, member) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  // Yetki kontrolü
  if (!isAdmin(member, guild.ownerId)) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Yetki Hatası",
          "Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız."
        ),
      ],
    });
  }

  const excuseId = interaction.options.getString("id");
  const karar = interaction.options.getString("karar");
  const aciklama = interaction.options.getString("aciklama") || "Değerlendirildi.";

  const excuse = excuseDB.reviewExcuse(excuseId, karar, user.id);

  if (!excuse) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Mazeret Bulunamadı",
          `\`${excuseId}\` ID'li mazeret kaydı bulunamadı.`
        ),
      ],
    });
  }

  // Karar açıklamasını kaydet
  excuse.reviewNote = aciklama;
  db.set(excuseId, excuse);

  // Log
  logsDB.addLog(guild.id, "mazeret", `${user.tag} mazeret ${karar} olarak işaretledi`, {
    excuseId,
    userId: excuse.userId,
    decision: karar,
  });

  const statusText = karar === "approved" ? "✅ ONAYLANDI" : "❌ REDDEDILDI";
  const embedColor = karar === "approved" ? config.colorHex.success : config.colorHex.error;

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`${statusText}`)
    .setDescription(
      `**Mazeret ID:** \`${excuseId}\`\n` +
        `**Kullanıcı:** <@${excuse.userId}>\n\n` +
        `**Karar:** ${aciklama}`
    )
    .setFooter({ text: config.branding.signature })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });

  // Kullanıcıya DM gönder
  try {
    const targetUser = await interaction.client.users.fetch(excuse.userId);
    const dmEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(`📝 Mazeret Durumunuz Güncellendi`)
      .setDescription(
        `**Sunucu:** ${guild.name}\n` +
          `**Durum:** ${statusText}\n` +
          `**İnceleyen:** ${user.username}\n\n` +
          `**Açıklama:** ${aciklama}`
      )
      .setFooter({ text: config.branding.signature })
      .setTimestamp();

    await targetUser.send({ embeds: [dmEmbed] });
  } catch (dmError) {
    logger.debug(`Mazeret DM gönderilemedi: ${excuse.userId}`);
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * 📝 MODAL HANDLERS - Mazeret Modal İşleyicileri
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * Mazeret Modal Submit İşleyici
 */
export async function handleMazeretModalSubmit(interaction, bot) {
  const guild = interaction.guild;
  const user = interaction.user;

  try {
    // Önce deferReply ile etkileşimi kabul et (3 saniye timeout'u önle)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sebep = interaction.fields.getTextInputValue("mazeret_sebep");
    const baslangic = interaction.fields.getTextInputValue("mazeret_baslangic");
    const sure = interaction.fields.getTextInputValue("mazeret_sure");
    const ek = interaction.fields.getTextInputValue("mazeret_ek") || "Belirtilmedi";

    // Mazereti kaydet
    const excuseId = excuseDB.addExcuse(user.id, guild.id, sebep, {
      baslangic,
      sure,
      ek,
    });

    // Log kanalına gönder
    const settings = db.get(`guild_settings_${guild.id}`) || {};
    const logChannelId = settings.channels?.mazeret;
    const logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;

    const logEmbed = new EmbedBuilder()
      .setColor(config.colorHex.warning)
      .setTitle("📝 YENI MAZERET BILDIRIMI")
      .addFields(
        { name: "👤 Kullanıcı", value: `<@${user.id}> (${user.tag})`, inline: false },
        { name: "🆔 Kullanıcı ID", value: user.id, inline: true },
        { name: "🆔 Mazeret ID", value: excuseId, inline: true },
        { name: "📝 Sebep", value: sebep, inline: false },
        { name: "📅 Başlangıç", value: baslangic, inline: true },
        { name: "⏱️ Süre", value: sure, inline: true },
        { name: "📎 Ek Bilgi", value: ek, inline: false }
      )
      .setFooter({ text: config.branding.signature })
      .setTimestamp();

    if (logChannel) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`mazeret_approve_${excuseId}`)
          .setLabel("✅ Onayla")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`mazeret_reject_${excuseId}`)
          .setLabel("❌ Reddet")
          .setStyle(ButtonStyle.Danger)
      );

      await logChannel.send({ embeds: [logEmbed], components: [row] });
    }

    // Log kaydı
    logsDB.addLog(guild.id, "mazeret", `${user.tag} yeni mazeret bildirdi`, {
      excuseId,
      userId: user.id,
    });

    // Kullanıcıya yanıt
    const successEmbed = PremiumEmbed.success(
      "✅ Mazeret Bildirildi",
      `Mazeretiniz başarıyla kaydedildi.\n\n` +
        `**Mazeret ID:** \`${excuseId}\`\n` +
        `**Durum:** ⏳ Beklemede\n\n` +
        `Yetkililer tarafından incelendikten sonra sonuç hakkında bilgilendirileceksiniz.`
    );

    await interaction.editReply({ embeds: [successEmbed] });

    logger.info(`[${guild.name}] ${user.tag} mazeret bildirdi: ${excuseId}`);
  } catch (error) {
    logger.error(`Mazeret modal submit hatası: ${error.message}`, error);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embeds: [PremiumEmbed.error("❌ Hata Oluştu", `Mazeret kaydedilirken bir hata oluştu: \`${error.message}\``)],
        });
      } else {
        await interaction.reply({
          embeds: [PremiumEmbed.error("❌ Hata Oluştu", `Mazeret kaydedilirken bir hata oluştu: \`${error.message}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      logger.debug(`Hata mesajı gönderilemedi: ${replyError.message}`);
    }
  }
}

/**
 * Mazeret Panel Buton İşleyicisi
 */
export async function handleMazeretPanelButton(interaction, bot) {
  try {
    if (interaction.customId === "mazeret_open_modal") {
      // Modal'ı aç
      const modal = new ModalBuilder()
        .setCustomId("mazeret_modal_submit")
        .setTitle("📝 Mazeret Bildirim Formu");

      const sebepInput = new TextInputBuilder()
        .setCustomId("mazeret_sebep")
        .setLabel("📝 Mazeret Sebebi (Detaylı)")
        .setPlaceholder("Mazeretinizin detaylı açıklamasını yazın...")
        .setStyle(TextInputStyle.Paragraph)
        .setMinLength(10)
        .setMaxLength(500)
        .setRequired(true);

      const baslangicInput = new TextInputBuilder()
        .setCustomId("mazeret_baslangic")
        .setLabel("📅 Başlangıç Tarihi/Saati")
        .setPlaceholder("Örn: 25.04.2025 09:00")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(50)
        .setRequired(true);

      const sureInput = new TextInputBuilder()
        .setCustomId("mazeret_sure")
        .setLabel("⏱️ Mazeret Süresi")
        .setPlaceholder("Örn: 3 gün, 48 saat...")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(50)
        .setRequired(true);

      const ekInput = new TextInputBuilder()
        .setCustomId("mazeret_ek")
        .setLabel("📎 Ek Bilgi (Opsiyonel)")
        .setPlaceholder("Varsa eklemek istediğiniz bilgiler...")
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(200)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(sebepInput),
        new ActionRowBuilder().addComponents(baslangicInput),
        new ActionRowBuilder().addComponents(sureInput),
        new ActionRowBuilder().addComponents(ekInput)
      );

      await interaction.showModal(modal);
    } else if (interaction.customId === "mazeret_listele") {
      // Mazeret listesini göster
      const user = interaction.user;
      const guild = interaction.guild;

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      const excuses = excuseDB.getUserExcuses(user.id, guild.id);

      if (excuses.length === 0) {
        return interaction.editReply({
          embeds: [
            PremiumEmbed.info(
              "📋 Mazeretleriniz",
              `Henüz kayıtlı mazeretiniz bulunmuyor.`
            ),
          ],
        });
      }

      const embed = new EmbedBuilder()
        .setColor(config.colorHex.info)
        .setTitle(`📋 ${user.username} - Mazeretler`)
        .setDescription(`Toplam **${excuses.length}** kayıt`)
        .setFooter({ text: config.branding.signature })
        .setTimestamp();

      const recentExcuses = excuses.slice(-5).reverse();

      for (const excuse of recentExcuses) {
        const statusEmoji =
          excuse.status === "pending"
            ? "⏳"
            : excuse.status === "approved"
            ? "✅"
            : "❌";

        embed.addFields({
          name: `${statusEmoji} ${excuse.id} • ${formatTurkishDate(excuse.createdAt)}`,
          value: excuse.reason.substring(0, 100) + (excuse.reason.length > 100 ? "..." : ""),
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    logger.debug(`Mazeret panel butonu hatası: ${error.message}`);
  }
}

/**
 * Mazeret Onay/Red Buton İşleyicileri
 */
export async function handleMazeretDecisionButton(interaction, bot) {
  const guild = interaction.guild;
  const user = interaction.user;
  const member = interaction.member;

  try {
    // Yetki kontrolü
    if (!isAdmin(member, guild.ownerId)) {
      return interaction.reply({
        embeds: [
          PremiumEmbed.error(
            "❌ Yetki Hatası",
            "Bu işlemi yapmak için yönetici yetkisine sahip olmalısınız."
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // customId format: mazeret_approve_excuse_1234567890 veya mazeret_reject_excuse_1234567890
    const parts = interaction.customId.split("_");
    const action = parts[1];
    const excuseId = parts.slice(2).join("_");
    const karar = action === "approve" ? "approved" : "rejected";

    // Mazeret kaydını kontrol et
    const excuse = excuseDB.getExcuse(excuseId);

    if (!excuse) {
      return interaction.reply({
        embeds: [
          PremiumEmbed.error(
            "❌ Mazeret Bulunamadı",
            "Bu mazeret kaydı bulunamadı veya silinmiş."
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Modal oluştur
    const modalTitle = karar === "approved" ? "✅ Mazeret Onayla" : "❌ Mazeret Reddet";
    const modal = new ModalBuilder()
      .setCustomId(`mazeret_decision_${karar}_${excuseId}`)
      .setTitle(modalTitle);

    const mesajInput = new TextInputBuilder()
      .setCustomId("mazeret_decision_mesaj")
      .setLabel(`Kullanıcıya gönderilecek mesaj`)
      .setPlaceholder("Kullanıcıya iletmek istediğiniz mesajı yazın...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    const row = new ActionRowBuilder().addComponents(mesajInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error) {
    logger.debug(`Mazeret decision modal açılamadı: ${error.message}`);
    // showModal timeout olduysa interaction expired, sessizce logla
  }
}

/**
 * Mazeret Karar Modal Submit İşleyicisi
 */
export async function handleMazeretDecisionModalSubmit(interaction, bot) {
  const guild = interaction.guild;
  const user = interaction.user;
  const member = interaction.member;

  try {
    // Önce deferReply ile etkileşimi kabul et (3 saniye timeout'u önle)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // customId format: mazeret_decision_approved_excuse_1234567890
    const parts = interaction.customId.split("_");
    // parts[0] = "mazeret", parts[1] = "decision", parts[2] = "approved"/"rejected", parts[3..] = "excuse", "1234567890"
    const karar = parts[2];
    const excuseId = parts.slice(3).join("_"); // "excuse_1234567890" olarak birleştir
    const customMessage = interaction.fields.getTextInputValue("mazeret_decision_mesaj");

    // Mazereti güncelle
    const excuse = excuseDB.reviewExcuse(excuseId, karar, user.id);

    if (!excuse) {
      return interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            "❌ Mazeret Bulunamadı",
            "Bu mazeret kaydı bulunamadı veya silinmiş."
          ),
        ],
      });
    }

    // Log
    logsDB.addLog(guild.id, "mazeret", `${user.tag} mazereti ${karar} olarak işaretledi`, {
      excuseId,
      userId: excuse.userId,
      decision: karar,
      customMessage,
    });

    const statusText = karar === "approved" ? "✅ ONAYLANDI" : "❌ REDDEDILDI";
    const embedColor = karar === "approved" ? config.colorHex.success : config.colorHex.error;

    // Kullanıcıya DM gönder (yönetici mesajı ile)
    try {
      const targetUser = await bot.users.fetch(excuse.userId);
      const dmEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`📝 Mazeret Durumunuz Güncellendi`)
        .setDescription(
          `**Sunucu:** ${guild.name}\n` +
            `**Durum:** ${statusText}\n` +
            `**İnceleyen:** ${user.username}\n\n` +
            `**Yönetici Mesajı:**\n` +
            `\`\`\`${customMessage}\`\`\`\n\n` +
            `Mazeret ID: \`${excuseId}\``
        )
        .setFooter({ text: config.branding.signature })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (dmError) {
      logger.debug(`Mazeret DM gönderilemedi: ${excuse.userId}`);
    }

    // Orjinal mesajı güncelle (message objesi üzerinden)
    try {
      const originalMessage = interaction.message;
      if (originalMessage) {
        const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
          .setColor(embedColor)
          .setTitle(`📝 MAZERET ${statusText}`)
          .addFields({
            name: "📌 İşlem",
            value: `${statusText} by ${user.username} • ${new Date().toLocaleTimeString("tr-TR")}`,
            inline: false,
          });

        // Butonları devre dışı bırak
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("disabled")
            .setLabel(karar === "approved" ? "✅ Onaylandı" : "❌ Reddedildi")
            .setStyle(karar === "approved" ? ButtonStyle.Success : ButtonStyle.Danger)
            .setDisabled(true)
        );

        await originalMessage.edit({
          embeds: [updatedEmbed],
          components: [disabledRow],
        });
      }
    } catch (editError) {
      logger.debug(`Orijinal mesaj güncellenemedi: ${editError.message}`);
    }

    // Yöneticiye onay mesajı
    await interaction.editReply({
      embeds: [
        PremiumEmbed.success(
          "✅ İşlem Tamamlandı",
          `Mazeret ${statusText} ve kullanıcıya DM gönderildi.`
        ),
      ],
    });

    logger.info(`[${guild.name}] ${user.tag} mazeret ${karar}: ${excuseId}`);
  } catch (error) {
    logger.error(`Mazeret karar modal hatası: ${error.message}`, error);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embeds: [PremiumEmbed.error("❌ Hata", `Bir hata oluştu: \`${error.message}\``)],
        });
      } else {
        await interaction.reply({
          embeds: [PremiumEmbed.error("❌ Hata", `Bir hata oluştu: \`${error.message}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      logger.debug(`Hata mesajı gönderilemedi: ${replyError.message}`);
    }
  }
}
