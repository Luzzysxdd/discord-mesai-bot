<div align="center">

# 🚨 Discord Mesai & Vardiya Yönetim Botu (v2.0)

<p align="center">
  <strong>FiveM & Roleplay Toplulukları İçin Gelişmiş, Endüstriyel Tasarımlı Mesai, Devriye, Mazeret ve Ekip Yönetim Sistemi</strong>
</p>

[![Developer](https://img.shields.io/badge/Developer-Luzzysxdd-D4AF37?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Luzzysxdd)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Attribution%20Protected-green?style=for-the-badge)](LICENSE)

<br/>

[🌟 GitHub Profilim](https://github.com/Luzzysxdd) • [📖 Lisans Bilgisi](LICENSE) • [⚡ Hızlı Kurulum](#-kurulum--yapılandırma)

---

</div>

## 📌 Proje Hakkında

**Discord Mesai Botu**, FiveM ve roleplay sunucularındaki kolluk kuvvetleri (LSPD, BCSO, SASP), acil servisler (EMS) ve diğer kurumsal ekipler için özel olarak geliştirilmiş endüstriyel standartta bir vardiya ve personel takip botudur. 

Discord.js v14 ile yeniden inşa edilmiş bu sistem; otomatik ses kanalı takibi, dinamik isim etiketi (`[M]`), anlık liderlik tablosu, devriye birim yönetimi, mazeret onay mekanizması, ceza puanı sistemi ve destek biletleri ile sunucu yönetimini zahmetsiz ve profesyonel hale getirir.

---

## ✨ Temel Özellikler

### ⏱️ Akıllı Mesai & Vardiya Takibi
- **Ses Kanalı Entegrasyonu:** Kullanıcının belirlenen ses kanallarında bulunup bulunmadığını periyodik olarak kontrol eder.
- **Otomatik İsim Tagı:** Mesaiye giren personelin ismine otomatik `[M]` ibaresi ekler, çıkış yaptığında kaldırır.
- **Canlı Durum Paneli:** `/mesai-panel` ile butonlu tek tıkla mesaiye giriş/çıkış ve aktif memur takibi.
- **Muafiyet Rolleri:** Belirlenen özel yetkili rollere esnek kontrol muafiyeti.

### 🏆 Liderlik Tablosu & İstatistikler
- **Dinamik Sıralama:** Günlük, haftalık ve tüm zamanlar bazında en çok mesai yapan personeller.
- **Madalya Sistemi:** İlk 3 personeli (🥇, 🥈, 🥉) ve sayfalama desteğiyle tüm ekibi listeleme.
- **Otomatik Raporlama:** Belirlenen aralıklarla sunucuya düzenli aktivite özeti gönderme.

### 📝 Mazeret / İzin Sistemi
- **/mazeret:** Personelin mazeret nedeni ve süresini belirterek izin talebinde bulunması.
- **Yönetici Onay Akışı:** Yetkililerin butonlarla mazeretleri onaylaması veya reddetmesi.
- **Zaman Aşımı Koruması:** Geçerliliğini yitiren mazeretlerin arşivlenmesi.

### 🚓 Birim & Devriye Yönetimi
- **Birim Oluşturma:** Devriye, asayiş, trafik ve özel operasyon birimleri kurma.
- **Personel Atama:** Memurları anlık olarak devriyelere atama ve devriye notları tutma.
- **/aktif-memurlar:** Sahada aktif olan tüm personeli birimleri ve ses kanallarıyla listeleme.

### ⚖️ Ceza & Uyarı Sistemi
- **Puan Tabanlı Ceza:** 100 puan üzerinden ceza puanı takibi (uyarı, susturma, geçici/kalıcı işlem kademeleri).
- **Geçmiş Sorgulama:** Personelin sicil kaydını ve geçmiş cezalarını görüntüleme.

### 🎫 Destek & Bilet Sistemi
- Özel kategori altında otomatik bilet (ticket) kanalı açma ve kapatma.
- Log kaydı tutma ve yetkili bildirimleri.

---

## 🛠️ Kullanılan Teknolojiler

- **Çalışma Ortamı:** Node.js (v18.0+)
- **Kütüphane:** [Discord.js v14](https://discord.js.org/)
- **Veritabanı:** Quick.db / JSON Yerel Veritabanı
- **Süreç Yönetimi:** PM2 (VDS / VPS ortamlarında 7/24 kesintisiz çalışma için optimize)
- **Tarih & Saat:** Moment.js & Moment-Timezone (Europe/Istanbul)

---

## 🚀 Kurulum & Yapılandırma

### 1. Gereksinimler
- [Node.js](https://nodejs.org/) v18 veya daha güncel bir sürüm
- Discord Developer Portal üzerinden oluşturulmuş bir Bot & Token

### 2. Adım Adım Kurulum

```bash
# 1. Depoyu klonlayın
git clone https://github.com/Luzzysxdd/discord-mesai-bot.git

# 2. Proje dizinine girin
cd discord-mesai-bot

# 3. Bağımlılıkları yükleyin
npm install
```

### 3. Ortam Değişkenleri (.env)

Proje ana dizinindeki `.env.example` dosyasını `.env` olarak kopyalayın ve bilgilerinizi girin:

```env
# Discord Bot Token (Developer Portal -> Bot -> Reset Token)
DISCORD_TOKEN=bot_tokeninizi_buraya_yazin

# Bot Uygulama (Client) ve Sunucu ID'leri
CLIENT_ID=botunuzun_client_id_degeri
GUILD_ID=sunucunuzun_id_degeri

# Veritabanı Dosya Yolu
DATABASE_PATH=./data/mesaibot.db
```

> [!CAUTION]
> `.env` dosyanızı ve bot token'ınızı asla GitHub'a veya başkalarıyla paylaşmayın! `.env` dosyası varsayılan olarak `.gitignore` içerisindedir.

### 4. Komutları Discord'a Kaydetme

Slash (`/`) komutlarını Discord API'sine kaydetmek için:

```bash
npm run deploy-commands
```

### 5. Botu Başlatma

**Geliştirme Ortamı:**
```bash
npm start
# veya otomatik yeniden başlatma ile:
npm run dev
```

**VDS / Sunucu Üretim Ortamı (PM2 ile 7/24 Kesintisiz):**
```bash
# PM2 ile başlatma
npm run prod

# Canlı logları izleme
npm run prod-logs

# Botu durdurma / yeniden başlatma
npm run prod-stop
npm run prod-restart
```

---

## ⚠️ Telif Hakkı & Çalınmaya Karşı Koruma (Copyright Notice)

> [!IMPORTANT]
> **Bu projenin tüm hakları [Luzzysxdd](https://github.com/Luzzysxdd) adına saklıdır.**

- **İmza ve Kaynak Gösterimi Zorunludur:** Bu projeyi veya kodlarını incelerken, fork ederken ya da kullanırken, bot altbilgisindeki (Embed Footer), konsoldaki ve dosyalardaki **Luzzysxdd** imzaları ve bağlantıları **kesinlikle silinemez, değiştirilemez veya gizlenemez**.
- **Sahiplenme Yasağı:** Kodları, sistem mimarisini veya tasarımı kendinize aitmiş gibi göstermek (plagiarism) yasaktır.
- **Ticari Satış Yasağı:** Bu proje veya türevleri izinsiz olarak satılamaz, kiralanamaz veya ticari kazanç amacıyla dağıtılamaz.

Detaylı lisans şartları için lütfen [`LICENSE`](LICENSE) dosyasını inceleyiniz.

---

## 👤 Geliştirici

<div align="center">

**Geliştirici & Tasarım:** **Luzzysxdd**  
GitHub: [https://github.com/Luzzysxdd](https://github.com/Luzzysxdd)

*Projeyi beğendiyseniz GitHub üzerinde bir ⭐ (Star) bırakmayı unutmayın!*

</div>
