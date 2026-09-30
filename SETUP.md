# 🤖 MESAI BOT - Premium Discord Management System

> **Geliştirici:** Luzzysxdd (https://github.com/Luzzysxdd)  
> **Sürüm:** 2.0.0 (Discord.js v14)  
> **Tema:** Endüstriyel Modern Tasarım

---

## 📋 Proje Özeti

**MESAI BOT**, profesyonel Discord sunucuları için gelişmiş bir **Mesai Yönetim Sistemi** botu. Ekip üyelerinin mesai saatlerini izler, otomatik kontrol mekanizmaları ile ses kanalı ve oyun tespit eder, detaylı raporlama ve liderlik tablosu sunar.

### ✨ Temel Özellikler

✅ **Gelişmiş Mesai Sistemi** - Otomatik ses kanalı ve oyun kontrolü  
✅ **Leaderboard & Pagination** - Sayfalamalı sıralaması  
✅ **Gerçek zamanlı Aktif Memur Listesi** - Yönetim kontrol paneli  
✅ **Mazeret/Özür Sistemi** - Modal form ile başvuru  
✅ **Birim & Devriye Yönetimi** - Operatör paneli  
✅ **14+ Log Kategorisi** - Detaylı denetim  
✅ **Premium UI Tasarımı** - Embed sistemleri ve butonlar  
✅ **Modüler Kod Mimarisi** - Kolay genişletilebilir  

---

## 🛠️ Teknoloji Stack

| Teknoloji | Versiyon | Amaç |
|-----------|---------|------|
| **Discord.js** | v14.13.0 | Bot framework |
| **Node.js** | 18.0+ | Runtime |
| **Quick.db** | v9.1.7 | Veri tabanı |
| **Moment.js** | v2.29.4 | Tarih/saat işlemleri |
| **Dotenv** | v16.3.1 | Ortam değişkenleri |

---

## 📦 Kurulum & Başlangıç

### 1️⃣ Ön Gereksinimler

- **Node.js** 18.0 veya üzeri
- **npm** paket yöneticisi
- **Discord Bot Token** (Discord Developer Portal'dan)

### 2️⃣ Repo'yu Clone Edin

```bash
git clone <repository-url>
cd mesaibot
```

### 3️⃣ Bağımlılıkları Yükleyin

```bash
npm install
```

### 4️⃣ Environment Ayarları

`.env.example` dosyasını kopyalayın ve `.env` olarak yeniden adlandırın:

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:

```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
OWNER_IDS=YOUR_DISCORD_ID_HERE
DB_PATH=./data/database.db
LOG_LEVEL=info
```

### 5️⃣ Veri Klasörü Oluşturun

```bash
mkdir -p data
mkdir -p logs
```

### 6️⃣ Botu Başlatın

**Geliştirme Modu (Auto-reload):**
```bash
npm run dev
```

**Üretim Modu:**
```bash
npm start
```

---

## 🎮 Slash Commands

### Mesai Sistemi

| Komut | Açıklama | Kullanım |
|-------|----------|---------|
| `/mesai-gir` | Mesaia başla | `/mesai-gir` |
| `/mesai-cik` | Mesaini bitir | `/mesai-cik` |
| `/aktif-memurlar` | Aktif memurları listele | `/aktif-memurlar` |

### İstatistikler

| Komut | Açıklama |
|-------|----------|
| `/leaderboard [sayfa]` | Top 10 memurlları gör (sayfalamalı) |
| `/en-iyi-memurlar` | Haftalık top list |

### Mazeret Sistemi

| Komut | Açıklama |
|-------|----------|
| `/mazeret-bildir` | Mazeret/özür başvurusu (Modal form) |
| `/mazeretler` | Başvurularımı gör |

### Birim Yönetimi

| Komut | Açıklama |
|-------|----------|
| `/birim-olustur [isim]` | Yeni devriye birimi oluştur |
| `/birim-ata [kullanıcı]` | Birime memurial |
| `/birim-notu [metin]` | Birim notlarını güncelle |

---

## 📁 Proje Yapısı

```
mesaibot/
├── bot.js                 # Main entry point
├── config.js             # Configuration (CRITICAL - tüm ayarlar buradan)
├── db.js                 # Database functions & models
├── package.json          # Dependencies
├── .env.example          # Environment template
├── README.md             # Bu dosya
│
├── commands/             # Slash commands
│   ├── mesai-gir.js     # Start shift
│   ├── mesai-cik.js     # End shift
│   ├── aktif-memurlar.js # Active users list
│   ├── leaderboard.js   # Top rankings
│   └── ...              # More commands
│
├── events/              # Discord events
│   ├── ready.js        # Bot ready
│   └── ...
│
├── utils/              # Helper utilities
│   ├── embeds.js      # Premium embed system
│   ├── logger.js      # Advanced logging
│   ├── helpers.js     # Utility functions
│   └── __init__.js
│
├── data/               # Database files
│   └── database.db    # Quick.db database
│
└── logs/              # Log files
    └── bot-DD-MM-YYYY.log
```

---

## 🎨 Design System

### Premium Renkler

```
🟡 Sarı (Primary):    #FFD700
🟠 Turuncu (Secondary): #FF8C00
⬛ Siyah (Dark):       #000000
🟢 Başarı (Success):   #00FF00
🔴 Hata (Error):       #FF0000
```

### Embed Şablonları

Tüm cevaplar profesyonel embed'ler ile verilir:

```javascript
// Başarı
PremiumEmbed.success("Başlık", "Açıklama")

// Hata
PremiumEmbed.error("Başlık", "Açıklama")

// Uyarı
PremiumEmbed.warning("Başlık", "Açıklama")

// Bilgi
PremiumEmbed.info("Başlık", "Açıklama")
```

### Button & Select Menu Sistemi

```javascript
// Buton
const buttons = new PremiumButtonRow()
  .addSuccessButton("id", "Etiketi")
  .addDangerButton("id", "Sil")
  .buildSingle()

// Select Menu
const select = new PremiumSelectMenu("customId", "Seçeneği seç")
  .addOption("Label", "value", "Açıklama", "emoji")
  .build()
```

---

## 🔧 Mesai Kontrol Sistemi

### Otomatik Checks (Her 60 saniye)

Bot, her 60 saniyede bir tüm aktif mesaiları kontrol eder:

1. **Ses Kanalı Kontrolü**: Kullanıcı ses kanalından ayrıldı mı?
2. **Oyun Tespit**: İzin verilmeyen oyun oynanıyor mu?
3. **Muafiyet Kontrol**: Kullanıcı muaf rol sahibi mi?

```javascript
// config.js içinde ayarlar:
mesai: {
  autoCheckEnabled: true,
  checkIntervalMs: 60000,
  voiceChannelRequired: true,
  gameDetectionEnabled: true,
  allowedGames: ["FiveM", "GTA Online"],
  exemptRoles: [], // Guild başına konfigüre
}
```

### [M] Tagı Sistemi

Mesaiye giren kullanıcıya otomatik `[M]` rol tagı eklenir, çıkınca kaldırılır:

```javascript
// config.js
mesai: {
  shiftTag: "[M]",
  shiftTagRemovalDelay: 5000,
}
```

---

## 📊 Veritabanı Yapısı

### Quick.db Collections

```javascript
// Mesai Data
db.set("mesai_[GUILD_ID]_[USER_ID]", {
  userId,
  guildId,
  startTime,
  isActive: true
})

// User Stats
db.set("user_stats_[GUILD_ID]_[USER_ID]", {
  totalShiftTime,    // ms
  shiftsCompleted,   // sayı
  lastShiftTime      // timestamp
})

// Mazeretler
db.set("excuse_[TIMESTAMP]", {
  id, userId, guildId, reason, status, createdAt, reviewedAt
})

// Loglar
db.get("logs") // Array of all logs
```

---

## 📝 Logging System

14+ Kategoriye ayrılmış detaylı loglama:

```javascript
// Log kategorileri
logging.categories: {
  mesaiGiris: "Mesai Giriş",
  mesaiCikis: "Mesai Çıkış",
  mazeret: "Mazeret Bildirimi",
  unitManagement: "Birim Yönetimi",
  patrolAssignment: "Devriye Ataması",
  ticketCreation: "Ticket Açılması",
  // ... + 8 more
}

// Log ekle
logsDB.addLog(guildId, "mesaiGiris", "Mesaj", metadata)

// Guild loglarını getir
logsDB.getGuildLogs(guildId, limit)
```

Loglar otomatik olarak `logs/` klasörüne günlük dosyalar halinde kaydedilir.

---

## 🔐 İzinler & Roller

### Admin İşlemleri

- **Toplu Mesai Bitir** - `/aktif-memurlar` komutu
- **Guild Ayarları** - `/sunucu-ayarlari`
- **Ceza Sistemi** - `/ceza-ver`

### Muafiyet Rolleri

`config.js` içinde muaf tutulacak rolleri tanımlayın:

```javascript
mesai.exemptRoles: [
  "ROLE_ID_1",
  "ROLE_ID_2"
]
```

---

## 🚀 Geliştirme Rehberi

### Yeni Komut Ekleme

`commands/` klasöründe yeni dosya oluşturun:

```javascript
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("komut-adi")
    .setDescription("Açıklama"),
  
  async execute(interaction, bot) {
    await interaction.reply("Merhaba!");
  }
};
```

### Yeni Event Handler

`events/` klasöründe:

```javascript
export default {
  name: "voiceStateUpdate",
  once: false,
  
  async execute(bot, oldState, newState) {
    // Event kodu
  }
};
```

### Database Operasyonları

```javascript
import { mesaiDB, leaderboardDB, excuseDB } from "./db.js";

// Mesai işlemleri
mesaiDB.startShift(userId, guildId);
mesaiDB.endShift(userId, guildId);
mesaiDB.getActiveUsers(guildId);

// Leaderboard
leaderboardDB.getLeaderboard(guildId, page, pageSize);
leaderboardDB.getTop10(guildId);

// Mazeretler
excuseDB.addExcuse(userId, guildId, reason);
excuseDB.reviewExcuse(excuseId, "approve", reviewedBy);
```

---

## 🐛 Troubleshooting

### Bot başlamıyor

```bash
# Hata loğunu kontrol et
tail -f logs/bot-*.log

# Token doğru mu?
echo $DISCORD_TOKEN

# Bağlantıyı test et
npm run dev
```

### Komutlar kayıtlanmıyor

```bash
# Bot token'ı doğru mu?
# Bot'a şu izinler gerekli:
# - ADMINISTRATOR
# - applications.commands

# Manual kaydı:
node scripts/deploy-commands.js
```

### Database hatası

```bash
# data/ klasörü var mı?
mkdir -p data logs

# Dosya izinleri tamam mı?
ls -la data/
```

---

## 📚 API Reference

### Embed Helper'ları

```javascript
import { 
  PremiumEmbed, 
  formatTime, 
  formatTurkishDate,
  mesaiEmbeds 
} from "./utils/embeds.js";

// Kullanım
const embed = PremiumEmbed.success("Başlık", "Açıklama");
const time = formatTime(3600000); // "1s"
const date = formatTurkishDate(Date.now());
```

### Helper Functions

```javascript
import {
  isUserInVoiceChannel,
  hasPermission,
  sendDMToUser,
  addRoleToUser,
  removeRoleFromUser
} from "./utils/helpers.js";
```

### Logger

```javascript
import logger from "./utils/logger.js";

logger.info("Bilgi mesajı");
logger.success("Başarı!");
logger.warn("Uyarı!");
logger.error("Hata!", error);
logger.debug("Debug (debug=true ise)");
```

---

## 🤝 Katkı Sağlama

1. Bu repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit edin (`git commit -m 'Add AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje özel lisans ve telif koruması altındadır. Detaylar için `LICENSE` dosyasına bakın.

---

## 👨‍💼 Geliştirici & İletişim

**Geliştirici:** [Luzzysxdd](https://github.com/Luzzysxdd)

- 🌐 GitHub: https://github.com/Luzzysxdd

---

## 🙏 Teşekkürler

- Discord.js Community

---

**Mesai Bot © 2024-2026 Luzzysxdd**

*Profesyonel yönetim için tasarlandı. Premium kalite ile geliştirildi.*
