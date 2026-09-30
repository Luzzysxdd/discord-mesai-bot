/**
 * ═══════════════════════════════════════════════════════════════
 * 🎫 COMMAND: TICKET-SETUP - Gelişmiş Ticket Sistemi
 * ═══════════════════════════════════════════════════════════════
 * Butonlu veya Select Menülü ticket paneli
 * Otomatik @Destek Ekibi etiketleme, Transkript alma
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
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from "discord.js";
import { db, logsDB } from "../db.js";
import { PremiumEmbed, formatTurkishDate } from "../utils/embeds.js";
import { isAdmin } from "../utils/helpers.js";
import { createChannelWithRetry } from "../utils/retry.js";
import logger from "../utils/logger.js";
import config from "../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("Gelişmiş ticket sistemi kurulumu")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("panel")
        .setDescription("Ticket açma paneli oluştur")
        .addChannelOption((option) =>
          option
            .setName("kanal")
            .setDescription("Panelin gönderileceği kanal")
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName("tip")
            .setDescription("Panel tipi")
            .setRequired(false)
            .addChoices(
              { name: "🎫 Butonlu Panel", value: "button" },
              { name: "📋 Select Menülü Panel", value: "select" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kategori")
        .setDescription("Ticket kategorilerini ayarla")
        .addStringOption((option) =>
          option
            .setName("tip1")
            .setDescription("1. Kategori tipi")
            .setRequired(false)
            .addChoices(
              { name: "🆘 Destek", value: "destek" },
              { name: "❗ Şikayet", value: "sikayet" },
              { name: "💼 Başvuru", value: "basvuru" },
              { name: "💰 Ödeme", value: "odeme" },
              { name: "🐛 Hata Bildirimi", value: "hata" }
            )
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rol")
        .setDescription("Destek ekibi rolünü ayarla")
        .addRoleOption((option) =>
          option
            .setName("destek_rolu")
            .setDescription("Destek ekibi rolü")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("kapat")
        .setDescription("Ticket kanalını kapat (Ticket kanalında kullanın)")
        .addStringOption((option) =>
          option
            .setName("sebep")
            .setDescription("Kapatma sebebi")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("ekle")
        .setDescription("Ticket'a kullanıcı ekle")
        .addUserOption((option) =>
          option.setName("kullanici").setDescription("Eklenecek kullanıcı").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("cikar")
        .setDescription("Ticket'tan kullanıcı çıkar")
        .addUserOption((option) =>
          option.setName("kullanici").setDescription("Çıkarılacak kullanıcı").setRequired(true)
        )
    ),

  async execute(interaction, bot) {
    const subcommand = interaction.options.getSubcommand();
    const guild = interaction.guild;
    const user = interaction.user;
    const member = interaction.member;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      switch (subcommand) {
        case "panel":
          await handleTicketPanel(interaction, guild, user);
          break;
        case "kategori":
          await handleTicketCategory(interaction, guild, user);
          break;
        case "rol":
          await handleTicketRole(interaction, guild, user);
          break;
        case "kapat":
          await handleTicketClose(interaction, guild, user, member);
          break;
        case "ekle":
          await handleTicketAddUser(interaction, guild, user, member);
          break;
        case "cikar":
          await handleTicketRemoveUser(interaction, guild, user, member);
          break;
        default:
          await interaction.editReply({
            embeds: [PremiumEmbed.error("❌ Hata", "Bilinmeyen alt komut.")],
          });
      }
    } catch (error) {
      logger.error(`Ticket-setup error: ${error.message}`, error);
      await interaction.editReply({
        embeds: [
          PremiumEmbed.error(
            "❌ Hata Oluştu",
            `Bir hata oluştu: \`${error.message}\``
          ),
        ],
      });
    }
  },
};

/**
 * 🎫 Ticket Paneli Oluştur
 */
async function handleTicketPanel(interaction, guild, user) {
  const targetChannel = interaction.options.getChannel("kanal") || interaction.channel;
  const panelType = interaction.options.getString("tip") || "button";

  if (panelType === "button") {
    // ═══ ULTRA MODERN BUTONLU PANEL ═══
    const mainEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: `${guild.name} • Destek Merkezi`,
        iconURL: guild.iconURL({ dynamic: true, size: 128 }),
      })
      .setTitle("✦ DESTEK TICKET SİSTEMİ")
      .setDescription(
        `\`\`\`ansi\n\u001b[2;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n\`\`\`\n` +
        `> Aşağıdaki butonlardan birini seçerek\n` +
        `> destek talebinizi oluşturabilirsiniz.\n\n` +
        `\`\`\`ansi\n\u001b[2;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n\`\`\`\n\n` +
        `**🆘 Destek Talebi**\n` +
        `╰ Genel yardım ve teknik destek\n\n` +
        `**❗ Şikayet**\n` +
        `╰ Kullanıcı veya sistem şikayetleri\n\n` +
        `**💼 Başvuru**\n` +
        `╰ Ekip başvurusu ve yetki talepleri`
      )
      .addFields(
        {
          name: "⚡ Yanıt Süresi",
          value: "```\n~15-30 dakika\n```",
          inline: true,
        },
        {
          name: "🕐 Çalışma Saatleri",
          value: "```\n7/24 Aktif\n```",
          inline: true,
        },
        {
          name: "📊 Durum",
          value: "```diff\n+ Açık\n```",
          inline: true,
        }
      )
      .setImage("https://i.imgur.com/empty.png") // Spacer
      .setFooter({
        text: `${config.branding.signature} • Spam ticket açanlar cezalandırılır`,
        iconURL: guild.iconURL({ dynamic: true, size: 64 }),
      })
      .setTimestamp();

    const buttonRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_create_destek")
        .setLabel("Destek Talebi")
        .setEmoji("🆘")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket_create_sikayet")
        .setLabel("Şikayet")
        .setEmoji("❗")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket_create_basvuru")
        .setLabel("Başvuru")
        .setEmoji("💼")
        .setStyle(ButtonStyle.Success)
    );

    await targetChannel.send({
      embeds: [mainEmbed],
      components: [buttonRow],
    });
  } else {
    // ═══ ULTRA MODERN SELECT MENÜLÜ PANEL ═══
    const mainEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: `${guild.name} • Destek Merkezi`,
        iconURL: guild.iconURL({ dynamic: true, size: 128 }),
      })
      .setTitle("✦ DESTEK TICKET SİSTEMİ")
      .setDescription(
        `\`\`\`ansi\n\u001b[2;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n\`\`\`\n` +
        `> Aşağıdaki menüden kategori seçerek\n` +
        `> destek talebinizi oluşturabilirsiniz.\n\n` +
        `\`\`\`ansi\n\u001b[2;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n\`\`\`\n\n` +
        `**🆘 Genel Destek** — Teknik yardım ve destek\n` +
        `**❗ Şikayet** — Kullanıcı/sistem şikayetleri\n` +
        `**💼 Başvuru** — Ekip başvurusu ve yetkiler\n` +
        `**💰 Ödeme** — Donation/ödeme sorunları\n` +
        `**🐛 Hata Bildirimi** — Bug ve sistem hataları`
      )
      .addFields(
        {
          name: "⚡ Yanıt Süresi",
          value: "```\n~15-30 dakika\n```",
          inline: true,
        },
        {
          name: "🕐 Çalışma Saatleri",
          value: "```\n7/24 Aktif\n```",
          inline: true,
        },
        {
          name: "📊 Durum",
          value: "```diff\n+ Açık\n```",
          inline: true,
        }
      )
      .setImage("https://i.imgur.com/empty.png") // Spacer
      .setFooter({
        text: `${config.branding.signature} • Spam ticket açanlar cezalandırılır`,
        iconURL: guild.iconURL({ dynamic: true, size: 64 }),
      })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("ticket_create_select")
      .setPlaceholder("✦ Ticket kategorisi seçin...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Genel Destek")
          .setDescription("Teknik destek veya yardım talebi")
          .setValue("destek")
          .setEmoji("🆘"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Şikayet")
          .setDescription("Kullanıcı veya sistem şikayeti")
          .setValue("sikayet")
          .setEmoji("❗"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Başvuru")
          .setDescription("Ekip başvurusu veya yetki talebi")
          .setValue("basvuru")
          .setEmoji("💼"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Ödeme")
          .setDescription("Donation veya ödeme sorunları")
          .setValue("odeme")
          .setEmoji("💰"),
        new StringSelectMenuOptionBuilder()
          .setLabel("Hata Bildirimi")
          .setDescription("Bug veya sistem hatası bildirimi")
          .setValue("hata")
          .setEmoji("🐛")
      );

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    await targetChannel.send({
      embeds: [mainEmbed],
      components: [selectRow],
    });
  }

  const successEmbed = PremiumEmbed.success(
    "✅ Ticket Paneli Oluşturuldu",
    `Ticket paneli <#${targetChannel.id}> kanalına gönderildi.\n\n` +
      `**Panel Tipi:** ${panelType === "button" ? "Butonlu" : "Select Menülü"}\n` +
      `**Otomatik Özellikler:**\n` +
      `• Ticket açılınca @Destek Ekibi etiketlenir\n` +
      `• Ticket kapatma butonu eklenir\n` +
      `• Transkript alma özelliği`
  );

  await interaction.editReply({ embeds: [successEmbed] });

  logsDB.addLog(guild.id, "settingChange", `${user.tag} ticket paneli oluşturdu`, {
    channelId: targetChannel.id,
    type: panelType,
  });

  logger.info(`[${guild.name}] ${user.tag} ticket panel oluşturdu`);
}

/**
 * 📋 Ticket Kategorisi Ayarla
 */
async function handleTicketCategory(interaction, guild, user) {
  const tip1 = interaction.options.getString("tip1");

  // Ayarları kaydet
  const settings = db.get(`ticket_settings_${guild.id}`) || {};
  settings.categories = settings.categories || [];

  if (tip1 && !settings.categories.includes(tip1)) {
    settings.categories.push(tip1);
  }

  db.set(`ticket_settings_${guild.id}`, settings);

  const embed = PremiumEmbed.success(
    "✅ Kategoriler Güncellendi",
    `Ticket kategorileri güncellendi.\n\n**Aktif Kategoriler:** ${
      settings.categories.join(", ") || "Tümü"
    }`
  );

  await interaction.editReply({ embeds: [embed] });
}

/**
 * 🎭 Destek Ekibi Rolü Ayarla
 */
async function handleTicketRole(interaction, guild, user) {
  const supportRole = interaction.options.getRole("destek_rolu");

  const settings = db.get(`ticket_settings_${guild.id}`) || {};
  settings.supportRoleId = supportRole.id;
  db.set(`ticket_settings_${guild.id}`, settings);

  const embed = PremiumEmbed.success(
    "✅ Destek Rolü Ayarlandı",
    `Destek ekibi rolü ${supportRole} olarak ayarlandı.\n\n` +
      `Artık ticket açıldığında bu rol otomatik olarak etiketlenecek.`
  );

  await interaction.editReply({ embeds: [embed] });

  logger.info(`[${guild.name}] Destek rolü ayarlandı: ${supportRole.name}`);
}

/**
 * 🔒 Ticket Kapat
 */
async function handleTicketClose(interaction, guild, user, member) {
  const reason = interaction.options.getString("sebep") || "Belirtilmedi";
  const channel = interaction.channel;

  // Ticket kanalı mı kontrol et
  if (!channel.name.startsWith("ticket-")) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Geçersiz Kanal",
          "Bu komut sadece ticket kanallarında kullanılabilir."
        ),
      ],
    });
  }

  // Yetki kontrolü (ticket sahibi veya admin)
  const ticketData = db.get(`ticket_${channel.id}`);
  const isTicketOwner = ticketData?.userId === user.id;
  const isStaff = isAdmin(member, guild.ownerId);

  if (!isTicketOwner && !isStaff) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error(
          "❌ Yetki Hatası",
          "Bu ticket'ı sadece sahibi veya yetkililer kapatabilir."
        ),
      ],
    });
  }

  // Transkript al
  await generateTranscript(channel, guild, user);

  // Kapatma bildirimi
  const closeEmbed = PremiumEmbed.info(
    "🔒 Ticket Kapatılıyor",
    `Bu ticket **${user.username}** tarafından kapatılıyor.\n**Sebep:** ${reason}\n\nKanal 5 saniye sonra silinecek...`
  );

  await interaction.editReply({ embeds: [closeEmbed] });

  // Log
  logsDB.addLog(guild.id, "ticketClosure", `${user.tag} ticket kapattı: #${channel.name}`, {
    userId: user.id,
    channelId: channel.id,
    reason,
  });

  // Kanalı sil
  setTimeout(async () => {
    try {
      await channel.delete(`Ticket kapatıldı by ${user.tag}`);
    } catch (error) {
      logger.error(`Ticket silme hatası: ${error.message}`);
    }
  }, 5000);
}

/**
 * 👤 Ticket'a Kullanıcı Ekle
 */
async function handleTicketAddUser(interaction, guild, user, member) {
  const targetUser = interaction.options.getUser("kullanici");
  const channel = interaction.channel;

  if (!channel.name.startsWith("ticket-")) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error("❌ Geçersiz Kanal", "Bu komut sadece ticket kanallarında kullanılabilir."),
      ],
    });
  }

  if (!isAdmin(member, guild.ownerId)) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error("❌ Yetki Hatası", "Bu işlemi yapmak için yetkili olmalısınız."),
      ],
    });
  }

  try {
    await channel.permissionOverwrites.create(targetUser.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    const embed = PremiumEmbed.success(
      "✅ Kullanıcı Eklendi",
      `${targetUser} ticket'a eklendi.`
    );

    await interaction.editReply({ embeds: [embed] });
    await channel.send({
      content: `👤 ${targetUser} ticket'a **${user.username}** tarafından eklendi.`,
    });
  } catch (error) {
    await interaction.editReply({
      embeds: [PremiumEmbed.error("❌ Hata", `Kullanıcı eklenirken hata: ${error.message}`)],
    });
  }
}

/**
 * 🚪 Ticket'tan Kullanıcı Çıkar
 */
async function handleTicketRemoveUser(interaction, guild, user, member) {
  const targetUser = interaction.options.getUser("kullanici");
  const channel = interaction.channel;

  if (!channel.name.startsWith("ticket-")) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error("❌ Geçersiz Kanal", "Bu komut sadece ticket kanallarında kullanılabilir."),
      ],
    });
  }

  if (!isAdmin(member, guild.ownerId)) {
    return interaction.editReply({
      embeds: [
        PremiumEmbed.error("❌ Yetki Hatası", "Bu işlemi yapmak için yetkili olmalısınız."),
      ],
    });
  }

  try {
    await channel.permissionOverwrites.delete(targetUser.id);

    const embed = PremiumEmbed.success("✅ Kullanıcı Çıkarıldı", `${targetUser} ticket'tan çıkarıldı.`);

    await interaction.editReply({ embeds: [embed] });
    await channel.send({
      content: `🚪 ${targetUser} ticket'tan **${user.username}** tarafından çıkarıldı.`,
    });
  } catch (error) {
    await interaction.editReply({
      embeds: [PremiumEmbed.error("❌ Hata", `Kullanıcı çıkarılırken hata: ${error.message}`)],
    });
  }
}

/**
 * 📄 Transkript Oluştur
 */
async function generateTranscript(channel, guild, closer) {
  try {
    // Basit transkript log
    const logEmbed = new EmbedBuilder()
      .setColor(config.colorHex.info)
      .setTitle("📄 TICKET TRANSKRIPT")
      .addFields(
        { name: "📋 Kanal", value: `#${channel.name}`, inline: true },
        { name: "👤 Kapatan", value: closer.username, inline: true },
        { name: "🕐 Tarih", value: formatTurkishDate(Date.now()), inline: true }
      )
      .setFooter({ text: config.branding.signature });

    const settings = db.get(`ticket_settings_${guild.id}`) || {};
    const logChannelId = settings.logChannelId || db.get(`guild_settings_${guild.id}`)?.channels?.ticket;
    const logChannel = logChannelId ? guild.channels.cache.get(logChannelId) : null;

    if (logChannel) {
      await logChannel.send({ embeds: [logEmbed] });
    }

    return true;
  } catch (error) {
    logger.error(`Transkript hatası: ${error.message}`);
    return false;
  }
}

/**
 * ═══════════════════════════════════════════════════════════════
 * 🎫 BUTTON & MODAL HANDLERS - Ticket İşleyicileri
 * ═══════════════════════════════════════════════════════════════
 */

/**
 * 🎫 Ticket Oluştur (Buton)
 */
export async function handleTicketCreate(interaction, bot, category) {
  const user = interaction.user;
  const guild = interaction.guild;
  const member = interaction.member;

  try {
    // Modal aç - Sebep sor
    const modal = new ModalBuilder()
      .setCustomId(`ticket_modal_${category}`)
      .setTitle(`🎫 ${category.toUpperCase()} TICKET`);

    const sebepInput = new TextInputBuilder()
      .setCustomId("ticket_sebep")
      .setLabel("📝 Destek Sebebi")
      .setPlaceholder("Lütfen destek talebinizin detaylarını yazın...")
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(10)
      .setMaxLength(1000)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(sebepInput);
    modal.addComponents(row);

    await interaction.showModal(modal);
  } catch (error) {
    logger.debug(`Ticket modal açılamadı: ${error.message}`);
    // showModal timeout olduysa interaction zaten expired, reply yapmaya çalışma
  }
}

/**
 * 🎫 Ticket Modal Submit
 */
export async function handleTicketModalSubmit(interaction, bot, category) {
  const user = interaction.user;
  const guild = interaction.guild;
  const member = interaction.member;

  try {
    const sebep = interaction.fields.getTextInputValue("ticket_sebep");

    // Açık ticket sayısını kontrol et
    const settings = db.get(`ticket_settings_${guild.id}`) || {};
    const userTickets = db.get(`user_tickets_${guild.id}_${user.id}`) || [];
    const activeTickets = userTickets.filter((t) => !t.closed);

    if (activeTickets.length >= config.ticket.maxOpenTickets) {
      return interaction.reply({
        embeds: [
          PremiumEmbed.error(
            "❌ Ticket Limiti",
            `Aynı anda en fazla **${config.ticket.maxOpenTickets}** ticket açabilirsiniz.\n` +
              `Mevcut ticket'larınızı kapatmadan yeni ticket açamazsınız.`
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Kategori ismini formatla
    const categoryNames = {
      destek: "🆘 DESTEK",
      sikayet: "❗ ŞİKAYET",
      basvuru: "💼 BAŞVURU",
      odeme: "💰 ÖDEME",
      hata: "🐛 HATA",
    };

    // Ticket kanalı oluştur
    const ticketNumber = (db.get(`ticket_counter_${guild.id}`) || 0) + 1;
    db.set(`ticket_counter_${guild.id}`, ticketNumber);

    const channelName = `ticket-${ticketNumber.toString().padStart(4, "0")}`;

    // Ticket kategorisi bul veya oluştur
    let ticketCategory = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === config.ticket.categoryName
    );

    if (!ticketCategory) {
      try {
        ticketCategory = await createChannelWithRetry(guild, {
          name: config.ticket.categoryName,
          type: ChannelType.GuildCategory,
        });
      } catch (catError) {
        logger.warn(`Ticket kategorisi oluşturulamadı: ${catError.message}`);
      }
    }

    // İzin ayarları
    const permissionOverwrites = [
      {
        id: guild.id,
        deny: ["ViewChannel"],
      },
      {
        id: user.id,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      },
    ];

    // Destek rolü varsa ekle
    if (settings.supportRoleId) {
      permissionOverwrites.push({
        id: settings.supportRoleId,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory", "ManageMessages"],
      });
    }

    const ticketChannel = await createChannelWithRetry(guild, {
      name: channelName,
      type: ChannelType.GuildText,
      parent: ticketCategory?.id || null,
      permissionOverwrites,
      topic: `${categoryNames[category] || category} - ${user.tag} - ${new Date().toLocaleDateString("tr-TR")}`,
    });

    // Ticket verisini kaydet
    const ticketData = {
      id: ticketNumber,
      channelId: ticketChannel.id,
      userId: user.id,
      category,
      reason: sebep,
      createdAt: Date.now(),
      closed: false,
    };

    db.set(`ticket_${ticketChannel.id}`, ticketData);
    db.set(`user_tickets_${guild.id}_${user.id}`, [...userTickets, ticketData]);

    // Ticket kanalına hoşgeldin mesajı
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({
        name: `${guild.name} • Ticket #${ticketNumber}`,
        iconURL: guild.iconURL({ dynamic: true, size: 128 }),
      })
      .setTitle(`${categoryNames[category] || "🎫"} DESTEK TALEBİ`)
      .setDescription(
        `\`\`\`ansi\n\u001b[2;36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n\`\`\`\n` +
        `Merhaba ${user}! Destek ekibimiz en kısa sürede\nsize yardımcı olacaktır.\n\n` +
        `**📝 Destek Sebebi:**\n\`\`\`\n${sebep}\n\`\`\``
      )
      .addFields(
        { name: "👤 Açan", value: `\`${user.tag}\``, inline: true },
        { name: "📂 Kategori", value: `\`${categoryNames[category] || category}\``, inline: true },
        { name: "🕐 Tarih", value: `\`${formatTurkishDate(Date.now())}\``, inline: true }
      )
      .setFooter({ text: `${config.branding.signature} • Ticket kapatmak için aşağıdaki butonu kullanın` })
      .setTimestamp();

    const controlRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_close_${ticketChannel.id}`)
        .setLabel("🔒 Ticket Kapat")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`ticket_transcript_${ticketChannel.id}`)
        .setLabel("📄 Transkript Al")
        .setStyle(ButtonStyle.Secondary)
    );

    await ticketChannel.send({
      content: settings.supportRoleId ? `<@&${settings.supportRoleId}> | ${user}` : `${user}`,
      embeds: [welcomeEmbed],
      components: [controlRow],
    });

    // Kullanıcıya bilgi
    const successEmbed = PremiumEmbed.success(
      "✅ Ticket Oluşturuldu",
      `Ticket'ınız başarıyla oluşturuldu: ${ticketChannel}\n\n` +
        `**Ticket Numarası:** #${ticketNumber}\n` +
        `**Kategori:** ${categoryNames[category] || category}\n\n` +
        `Destek ekibi en kısa sürede size yardımcı olacaktır.`
    );

    await interaction.editReply({ embeds: [successEmbed] });

    // Log
    logsDB.addLog(guild.id, "ticketCreation", `${user.tag} ticket oluşturdu: #${channelName}`, {
      userId: user.id,
      channelId: ticketChannel.id,
      category,
    });

    logger.info(`[${guild.name}] ${user.tag} ticket oluşturdu: #${channelName}`);
  } catch (error) {
    logger.error(`Ticket modal submit hatası: ${error.message}`, error);
    
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          embeds: [PremiumEmbed.error("❌ Hata Oluştu", `Ticket oluşturulurken bir hata oluştu: \`${error.message}\``)],
        });
      } else {
        await interaction.reply({
          embeds: [PremiumEmbed.error("❌ Hata Oluştu", `Ticket oluşturulurken bir hata oluştu: \`${error.message}\``)],
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch (replyError) {
      logger.debug(`Ticket hata mesajı gönderilemedi: ${replyError.message}`);
    }
  }
}

/**
 * 🔒 Ticket Kapat Butonu
 */
export async function handleTicketCloseButton(interaction, bot) {
  const user = interaction.user;
  const guild = interaction.guild;
  const member = interaction.member;
  const channel = interaction.channel;

  try {
    // Yetki kontrolü
    const ticketData = db.get(`ticket_${channel.id}`);
    const isTicketOwner = ticketData?.userId === user.id;
    const isStaff = isAdmin(member, guild.ownerId);

    if (!isTicketOwner && !isStaff) {
      return interaction.reply({
        embeds: [
          PremiumEmbed.error(
            "❌ Yetki Hatası",
            "Bu ticket'ı sadece sahibi veya yetkililer kapatabilir."
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // Onay modalı
    const modal = new ModalBuilder()
      .setCustomId("ticket_close_confirm")
      .setTitle("🔒 Ticket Kapatma Onayı");

    const sebepInput = new TextInputBuilder()
      .setCustomId("ticket_close_sebep")
      .setLabel("📝 Kapatma Sebebi (Opsiyonel)")
      .setPlaceholder("Kapatma sebebini belirtin...")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(200)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(sebepInput));

    await interaction.showModal(modal);
  } catch (error) {
    logger.debug(`Ticket kapatma modal açılamadı: ${error.message}`);
  }
}

/**
 * 🔒 Ticket Kapatma Onay Modalı
 */
export async function handleTicketCloseConfirm(interaction, bot) {
  const user = interaction.user;
  const guild = interaction.guild;
  const channel = interaction.channel;

  await interaction.deferReply();

  try {
    const sebep = interaction.fields.getTextInputValue("ticket_close_sebep") || "Belirtilmedi";

    // Transkript al
    await generateTranscript(channel, guild, user);

    const closeEmbed = PremiumEmbed.info(
      "🔒 Ticket Kapatılıyor",
      `Bu ticket **${user.username}** tarafından kapatılıyor.\n` +
        `**Sebep:** ${sebep}\n\nKanal 5 saniye sonra silinecek...`
    );

    await interaction.editReply({ embeds: [closeEmbed] });

    // Ticket verisini güncelle
    const ticketData = db.get(`ticket_${channel.id}`);
    if (ticketData) {
      ticketData.closed = true;
      ticketData.closedAt = Date.now();
      ticketData.closedBy = user.id;
      ticketData.closeReason = sebep;
      db.set(`ticket_${channel.id}`, ticketData);
    }

    // Log
    logsDB.addLog(guild.id, "ticketClosure", `${user.tag} ticket kapattı: #${channel.name}`, {
      userId: user.id,
      channelId: channel.id,
      reason: sebep,
    });

    // Kanalı sil
    setTimeout(async () => {
      try {
        await channel.delete(`Ticket kapatıldı by ${user.tag}`);
      } catch (error) {
        logger.error(`Ticket silme hatası: ${error.message}`);
      }
    }, 5000);
  } catch (error) {
    logger.error(`Ticket kapatma hatası: ${error.message}`);
  }
}

/**
 * 📄 Transkript Butonu
 */
export async function handleTicketTranscript(interaction, bot) {
  const user = interaction.user;
  const guild = interaction.guild;
  const channel = interaction.channel;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const success = await generateTranscript(channel, guild, user);

  if (success) {
    await interaction.editReply({
      embeds: [PremiumEmbed.success("✅ Transkript Alındı", "Ticket transkripti log kanalına gönderildi.")],
    });
  } else {
    await interaction.editReply({
      embeds: [PremiumEmbed.error("❌ Hata", "Transkript alınırken bir hata oluştu.")],
    });
  }
}
