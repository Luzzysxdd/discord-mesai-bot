/**
 * ═══════════════════════════════════════════════════════════════
 * 🎨 MESAI BOT - CONFIGURATION (v2.0 - Discord.js v14)
 * ═══════════════════════════════════════════════════════════════
 * Profesyonel, Endüstriyel Premium Tasarım
 * Developed By: Luzzysxdd (https://github.com/Luzzysxdd)
 */

export const config = {
  // ═══ BOT BASIC INFO ═══
  bot: {
    name: "MESAI BOT",
    version: "2.0.0",
    status: "🔴 MESAI - Ekibinizi Yönetin",
    statusType: "WATCHING", // PLAYING, WATCHING, LISTENING
  },

  // ═══ BRANDING & DEVELOPER CREDITS ═══
  branding: {
    developer: "Luzzysxdd",
    copyright: "© 2024-2026 Luzzysxdd",
    website: "https://github.com/Luzzysxdd",
    icon: "🚨", // Bot emoji
    // İMZA: Botun tüm footer'larında görünecek
    signature: "Bu Bot Luzzysxdd Tarafından Geliştirilmiştir",
    signatureIcon: "🔰",
  },

  // ═══ INDUSTRIAL MODERN COLOR THEME ═══
  // Referans: Modern, endüstriyel ve profesyonel tasarım
  colors: {
    primary: "#2D2D2D",      // Koyu Gri (Ana zemin)
    secondary: "#5865F2",  // Mor/Mavi (Discord blurple - Secondary)
    dark: "#1A1A1A",         // Siyah (Koyu zemin)
    darker: "#0F0F0F",       // Daha koyu siyah
    success: "#22C55E",      // Yeşil (Success)
    error: "#EF4444",        // Kırmızı (Danger)
    info: "#3B82F6",         // Mavi (Info)
    warning: "#F59E0B",      // Turuncu (Warning)
    accent: "#8B5CF6",       // Mor vurgu (Accent)
    light: "#E5E7EB",        // Açık gri (Metin)
    muted: "#9CA3AF",        // Soluk gri (Muted text)
  },

  // ═══ HEX COLORS FOR EMBEDS ═══
  colorHex: {
    primary: 0x2D2D2D,       // Koyu Gri
    secondary: 0x5865F2,    // Mor/Mavi
    dark: 0x1A1A1A,         // Siyah
    darker: 0x0F0F0F,       // Daha koyu
    success: 0x22C55E,      // Yeşil
    error: 0xEF4444,        // Kırmızı
    info: 0x3B82F6,         // Mavi
    warning: 0xF59E0B,      // Turuncu
    accent: 0x8B5CF6,       // Mor
    light: 0xE5E7EB,        // Açık gri
    muted: 0x9CA3AF,        // Soluk gri
  },

  // ═══ MESAI (SHIFT) SYSTEM CONFIGURATION ═══
  mesai: {
    // Otomatik kontrol döngüsü
    autoCheckEnabled: true,
    checkIntervalMs: 60000, // 60 saniye (üretime göre 300000 yapılabilir)
    
    // Ses kanalı gereksinimleri
    voiceChannelRequired: true,
    voiceChannelCheckEnabled: true,
    
    // Oyun tespit ayarları
    gameDetectionEnabled: true,
    allowedGames: [
      "FiveM",
      "GTA Online",
      "Grand Theft Auto",
      "Discord",
      "Visual Studio Code",
      "Custom Status", // Kendi statüsü olanlar
    ],
    
    // İzin verilen siteler (oyun dışı)
    allowedWebsites: [
      "twitch.tv",
      "youtube.com",
      "reddit.com",
      "google.com",
    ],

    // Etiket ayarları
    shiftTag: "[M]", // Mesai tagı
    shiftTagRemovalDelay: 5000, // 5 saniye sonra kaldır
    
    // Muafiyet rolleri (rol ID'leri)
    exemptRoles: [], // Guild başına konfigüre edilir
    
    // Inaktivite kontrolü
    inactivityWarningHours: 2,
    inactivityKickHours: 4,
    
    // Azami mesai süresi (saatlik rapor)
    hourlyReportEnabled: true,
    hourlyReportIntervalMs: 3600000, // 1 saat
  },

  // ═══ LEADERBOARD & STATISTICS ═══
  leaderboard: {
    enabled: true,
    pageSize: 10, // Sayfa başı kaç kişi
    updateIntervalMs: 300000, // 5 dakika
    
    // Zaman dilimleri
    periods: {
      daily: "24 saat",
      weekly: "7 gün",
      monthly: "30 gün",
      allTime: "Tüm Zamanlar",
    },
  },

  // ═══ EXCUSE/MAZERET SYSTEM ═══
  excuse: {
    enabled: true,
    maxCharacters: 500,
    minCharacters: 10,
    expirationDays: 30, // Mazeretler 30 gün sonra silinir
    
    // Mazeret durumları
    statuses: {
      pending: "Beklemede",
      approved: "Onaylandı",
      rejected: "Reddedildi",
      expired: "Süresi Doldu",
    },
  },

  // ═══ UNIT & PATROL SYSTEM ═══
  unit: {
    enabled: true,
    maxPatrolsPerUnit: 10,
    maxNotesLength: 1000,
    
    // Birim türleri
    types: {
      patrol: "Devriye",
      security: "Güvenlik",
      traffic: "Trafik",
      custom: "Özel",
    },
  },

  // ═══ TICKET SYSTEM ═══
  ticket: {
    enabled: true,
    categoryName: "📋 DESTEK TİKETLERİ",
    maxOpenTickets: 5,
    autoCloseInactiveHours: 24,
    
    // Ticket statüsü
    statuses: {
      open: "Açık",
      onHold: "Beklemede",
      closed: "Kapatıldı",
      resolved: "Çözüldü",
    },
  },

  // ═══ PENALTY & WARNING SYSTEM ═══
  penalty: {
    enabled: true,
    maxPoints: 100,
    pointDecayDays: 30,
    
    // Ceza seviyeleri
    levels: {
      warning: 10,
      mute: 25,
      tempban: 50,
      permanentban: 100,
    },
  },

  // ═══ LOGGING & TRACKING ═══
  logging: {
    enabled: true,
    
    // 14+ Log kategorileri
    categories: {
      mesaiGiris: "Mesai Giriş",
      mesaiCikis: "Mesai Çıkış",
      mazeret: "Mazeret Bildirimi",
      unitManagement: "Birim Yönetimi",
      patrolAssignment: "Devriye Ataması",
      ticketCreation: "Ticket Açılması",
      ticketClosure: "Ticket Kapatılması",
      penalty: "Ceza Verilmesi",
      warning: "Uyarı Verilmesi",
      moderation: "Moderasyon İşlemi",
      botError: "Bot Hatası",
      roleManagement: "Rol Yönetimi",
      userManagement: "Kullanıcı Yönetimi",
      settingChange: "Ayar Değişimi",
      activityTest: "Aktiflik Testi",
    },
    
    // Log renkleri (renkli konsol output)
    colors: {
      success: "\x1b[32m", // Yeşil
      error: "\x1b[31m", // Kırmızı
      warning: "\x1b[33m", // Sarı
      info: "\x1b[36m", // Mavi
      reset: "\x1b[0m",
    },
  },

  // ═══ TIME & TIMEZONE SETTINGS ═══
  time: {
    timezone: "Europe/Istanbul",
    dateFormat: "DD.MM.YYYY HH:mm:ss",
    reportTime: "08:00", // Günlük rapor saati
  },

  // ═══ PERMISSIONS & ROLES ═══
  roles: {
    admin: "ADMINISTRATOR",
    moderator: "MANAGE_GUILD",
    operator: "Operatör", // Rol adı
    member: "Üye",
  },

  // ═══ COMMAND SETTINGS ═══
  commands: {
    cooldown: 3000, // Komut cooldown (ms)
    ephemeral: false, // Sadece komut sahibine görünsün mü
    
    // Prefix (Slash commands için gerekli değil, ama uyumlu tutmak için)
    prefix: "/",
  },

  // ═══ DATABASE SETTINGS ═══
  database: {
    // Quick.db varsayılan
    type: "quick.db", // "quick.db" veya "mongodb"
    path: "./data/database.db",
    
    // Veya MongoDB için:
    // mongodb_uri: "mongodb://localhost:27017/mesaibot",
  },

  // ═══ EMBED TEMPLATE SETTINGS ═══
  embeds: {
    // Footer
    footer: {
      text: "Mesai Bot © Luzzysxdd",
      iconURL: null, // Bot icon URL (dinamik olarak set edilir)
    },
    
    // Timestamp her embede eklensin mi
    timestamp: true,
    
    // Default thumbnail
    thumbnail: null,
  },

  // ═══ BUTTON & INTERACTION STYLES ═══
  interactions: {
    // Button stiller
    buttonStyle: "PRIMARY", // PRIMARY, SECONDARY, SUCCESS, DANGER, LINK
    
    // Timeout (ms cinsinden)
    selectMenuTimeout: 60000, // 60 saniye
    modalTimeout: 300000, // 5 dakika
    
    // Emoji'ler
    emojis: {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
      loading: "⏳",
      clock: "⏰",
      user: "👤",
      users: "👥",
      shield: "🛡️",
      sword: "⚔️",
      star: "⭐",
      fire: "🔥",
      link: "🔗",
      edit: "✏️",
      delete: "🗑️",
      close: "🔴",
      open: "🟢",
    },
  },

  // ═══ ACTIVITY TESTING ═══
  activityTest: {
    enabled: true,
    questionLimit: 5,
    timePerQuestion: 30000, // 30 saniye
    passingScore: 60, // %60 başarı oranı
  },

  // ═══ ADVANCED FEATURES ═══
  features: {
    autoModeration: true,
    messageLogging: true,
    reactionRoles: false,
    customStatus: true,
    dailyReports: true,
    weeklyAnalytics: true,
  },
};

// ═══ EXPORT CONFIG ═══
export default config;
