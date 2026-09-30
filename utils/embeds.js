/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 EMBED & UI UTILITIES - PREMIUM DESIGN SYSTEM
 * ═══════════════════════════════════════════════════════════════
 * Sarı (#FFD700), Turuncu (#FF8C00), Siyah (#000000)
 */

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SelectMenuBuilder,
  SelectMenuOptionBuilder,
} from "discord.js";
import config from "../config.js";
import moment from "moment-timezone";

/**
 * Premium Embed Template - Industrial Modern Design
 * Referans: Görseldeki koyu gri/siyah zemin, Yeşil, Kırmızı, Mor/Mavi tema
 */
export class PremiumEmbed extends EmbedBuilder {
  constructor(title = "", description = "") {
    super();

    this.setColor(config.colorHex.dark)
      .setTitle(title || "⚠️ Başlık Belirtilmedi")
      .setDescription(description || "")
      .setFooter({
        text: config.branding.signature,
        iconURL: null,
      })
      .setTimestamp();
  }

  // Başarı embed'i
  static success(title, description) {
    return new PremiumEmbed(title, description).setColor(config.colorHex.success);
  }

  // Hata embed'i
  static error(title, description) {
    return new PremiumEmbed(title, description).setColor(config.colorHex.error);
  }

  // Uyarı embed'i
  static warning(title, description) {
    return new PremiumEmbed(title, description).setColor(config.colorHex.warning);
  }

  // Bilgi embed'i - Mavi
  static info(title, description) {
    return new PremiumEmbed(title, description).setColor(config.colorHex.info);
  }

  // Mor/Mavi (Secondary) embed'i
  static secondary(title, description) {
    return new PremiumEmbed(title, description).setColor(config.colorHex.secondary);
  }

  // Ana Koyu Gri (Primary) embed'i
  static primary(title, description) {
    return new PremiumEmbed(title, description).setColor(config.colorHex.primary);
  }

  // Siyah (Dark) embed'i
  static dark(title, description) {
    return new PremiumEmbed(title, description).setColor(config.colorHex.darker);
  }
}

/**
 * Format Time Helper
 */
export function formatTime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  let result = "";
  if (days > 0) result += `${days}g `;
  if (hours > 0) result += `${hours}s `;
  if (minutes > 0) result += `${minutes}d `;
  if (seconds > 0) result += `${seconds}sn`;

  return result.trim() || "0sn";
}

/**
 * Format Turkish Date
 */
export function formatTurkishDate(timestamp) {
  return moment(timestamp)
    .tz(config.time.timezone)
    .format("DD.MM.YYYY HH:mm:ss");
}

/**
 * Premium Button Row
 */
export class PremiumButtonRow {
  constructor() {
    this.row = new ActionRowBuilder();
    this.buttons = [];
  }

  addButton(
    customId,
    label,
    style = ButtonStyle.Primary,
    emoji = null,
    disabled = false
  ) {
    const button = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(style)
      .setDisabled(disabled);

    if (emoji) button.setEmoji(emoji);

    this.buttons.push(button);
    return this;
  }

  // Başarı butonu
  addSuccessButton(customId, label, emoji = null) {
    return this.addButton(
      customId,
      label,
      ButtonStyle.Success,
      emoji || "✅"
    );
  }

  // Hata/Danger butonu
  addDangerButton(customId, label, emoji = null) {
    return this.addButton(
      customId,
      label,
      ButtonStyle.Danger,
      emoji || "❌"
    );
  }

  // Bilgi butonu
  addSecondaryButton(customId, label, emoji = null) {
    return this.addButton(
      customId,
      label,
      ButtonStyle.Secondary,
      emoji || "ℹ️"
    );
  }

  build() {
    if (this.buttons.length === 0) return null;

    // Max 5 button per row
    const rows = [];
    for (let i = 0; i < this.buttons.length; i += 5) {
      const rowButtons = this.buttons.slice(i, i + 5);
      rows.push(
        new ActionRowBuilder().addComponents(rowButtons)
      );
    }

    return rows;
  }

  // Tek row return
  buildSingle() {
    if (this.buttons.length === 0) return null;
    return new ActionRowBuilder().addComponents(
      this.buttons.slice(0, 5)
    );
  }
}

/**
 * Premium Select Menu
 */
export class PremiumSelectMenu {
  constructor(customId, placeholder) {
    this.customId = customId;
    this.placeholder = placeholder;
    this.options = [];
  }

  addOption(label, value, description = "", emoji = null) {
    this.options.push({
      label,
      value,
      description,
      emoji,
    });
    return this;
  }

  build() {
    if (this.options.length === 0) return null;

    const selectMenu = new SelectMenuBuilder()
      .setCustomId(this.customId)
      .setPlaceholder(this.placeholder)
      .setMinValues(1)
      .setMaxValues(1);

    this.options.forEach((opt) => {
      selectMenu.addOptions(
        new SelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value)
          .setDescription(opt.description)
          .setEmoji(opt.emoji)
      );
    });

    return new ActionRowBuilder().addComponents(selectMenu);
  }
}

/**
 * MESAI SYSTEM EMBEDS
 */

export const mesaiEmbeds = {
  /**
   * Mesaia hoş geldin
   */
  shiftStarted(user) {
    return PremiumEmbed.success(
      `${config.interactions.emojis.open} MESAI BAŞLADI`,
      `
Hoş geldin **${user.username}**! 🎯

**Mesain başarıyla başladı.** Ses kanalında aktif kalmalısın.
      `
    ).setThumbnail(user.displayAvatarURL());
  },

  /**
   * Mesaiden çık
   */
  shiftEnded(user, duration, totalTime) {
    return PremiumEmbed.secondary(
      `${config.interactions.emojis.close} MESAI BİTTİ`,
      `
**${user.username}** mesai sona erdi! 👋

**Bu Mesai:** ${formatTime(duration)}
**Toplam Mesai:** ${formatTime(totalTime)}
      `
    ).setThumbnail(user.displayAvatarURL());
  },

  /**
   * Mesaiye otomatik başlama (voice channel'a giriş)
   */
  autoShiftStart(user, channel) {
    return PremiumEmbed.info(
      `${config.interactions.emojis.open} OTOMATİK MESAI BAŞLADI`,
      `
**${user.username}** ${channel.name} kanalına girdiğin için 
otomatik olarak mesaia alındın! 🚀

*Ses kanalından ayrılırsan mesain otomatik olarak sona erecektir.*
      `
    );
  },

  /**
   * Uyarı: Ses kanalından ayrıldı
   */
  warningLeftVoice(user) {
    return PremiumEmbed.warning(
      `${config.interactions.emojis.warning} SES KANAL UYARISI`,
      `
**${user.username}** Ses kanalından ayrıldığın için 2 dakika içinde mesain sona erecek!

Kanalda kalırsan devam edebilirsin.
      `
    );
  },

  /**
   * Hata: Oyun oynanıyor
   */
  warningGameDetected(user, gameName) {
    return PremiumEmbed.warning(
      `${config.interactions.emojis.warning} OYUN TESPİTİ`,
      `
**${user.username}** *${gameName}* oynadığı tespit edildi!

İzin verilen oyunları: **FiveM, GTA Online** vb.

Diğer oyunları oynarken mesai yapamassın.
      `
    );
  },

  /**
   * Mesaiden otomatik atılma
   */
  autoKickFromShift(user, reason) {
    return PremiumEmbed.error(
      `${config.interactions.emojis.close} MESAIDEN ÇIKARILDIN`,
      `
**${user.username}** Mesaiden otomatik olarak çıkarıldın!

**Sebep:** ${reason}

Şikayetini yazmak için komutu kullan: \`/mazeret-bildir\`
      `
    );
  },
};

/**
 * CONTROL PANEL EMBEDS
 */

export const controlPanelEmbeds = {
  /**
   * Ana Kontrol Paneli
   */
  mainPanel() {
    return new PremiumEmbed(
      `${config.interactions.emojis.shield} KONTROL PANELİ`,
      `
**Mesai Bot Premium v2.0**

Aşağıdaki işlemleri gerçekleştir:
      `
    ).addFields(
      {
        name: `${config.interactions.emojis.open} Mesai Sistemi`,
        value:
          "Mesaia gir, mesaiden çık ve aktif kullanıcıları gör",
        inline: false,
      },
      {
        name: `${config.interactions.emojis.users} Leaderboard`,
        value: "Ekip üyelerinin sıralamasını ve istatistiklerini gör",
        inline: false,
      },
      {
        name: `${config.interactions.emojis.shield} Birimler`,
        value:
          "Devriye birimlerini yönet ve operatör not defteri",
        inline: false,
      }
    );
  },

  /**
   * Mesai Bilgisi
   */
  shiftInfo(user, isActive, duration) {
    const status = isActive
      ? `${config.interactions.emojis.open} **AKTIF**`
      : `${config.interactions.emojis.close} **KAPALI**`;

    return new PremiumEmbed(
      `${config.interactions.emojis.clock} MESAİ BİLGİSİ`,
      `
**Kullanıcı:** ${user}
**Durum:** ${status}
**Süre:** ${formatTime(duration)}
      `
    );
  },
};

/**
 * LEADERBOARD EMBEDS
 */

export const leaderboardEmbeds = {
  /**
   * Top 10 Leaderboard
   */
  topList(data, page = 1, totalPages = 1) {
    const embed = new PremiumEmbed(
      `${config.interactions.emojis.fire} TOP MEMURLLAR`,
      "Ekibin en aktif üyeleri 🏆\n"
    );

    data.forEach((item, index) => {
      embed.addFields({
        name: `#${(page - 1) * 10 + index + 1} • <@${item.userId}>`,
        value: `⏱️ ${formatTime(item.totalShiftTime)} (${item.shiftsCompleted} mesai)`,
        inline: false,
      });
    });

    if (totalPages > 1) {
      embed.setFooter({
        text: `Sayfa ${page}/${totalPages} • ${config.branding.developer}`,
      });
    }

    return embed;
  },
};

/**
 * LOGGING & NOTIFICATION EMBEDS
 */

export const notificationEmbeds = {
  /**
   * Log Notification
   */
  log(category, message, user = null, metadata = {}) {
    const embed = new PremiumEmbed()
      .setTitle(`${config.interactions.emojis.info} ${category}`)
      .setDescription(message)
      .setTimestamp();

    if (user) {
      embed.addFields({
        name: "Kullanıcı",
        value: `<@${user.id}> (${user.tag})`,
        inline: true,
      });
    }

    return embed;
  },

  /**
   * Error Log
   */
  errorLog(error, context = "") {
    return PremiumEmbed.error(
      `${config.interactions.emojis.error} BOT HATASI`,
      `
\`\`\`
${error.message}
\`\`\`

**Context:** ${context || "Bilinmiyor"}
      `
    );
  },
};

export default {
  PremiumEmbed,
  PremiumButtonRow,
  PremiumSelectMenu,
  formatTime,
  formatTurkishDate,
  mesaiEmbeds,
  controlPanelEmbeds,
  leaderboardEmbeds,
  notificationEmbeds,
};
