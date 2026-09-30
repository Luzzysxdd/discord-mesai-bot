# 🎯 QUICK REFERENCE - Mesai Bot Commands & Features

## ⚡ Instant Setup

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env with your Discord token

# 3. Run
npm run dev  # Development (auto-reload)
npm start    # Production
```

## 🎮 All Commands (Quick List)

### Mesai System
| Command | Params | What it does |
|---------|--------|-------------|
| `/mesai-gir` | - | Start your shift |
| `/mesai-cik` | - | End your shift |
| `/aktif-memurlar` | - | See all active members |

### Statistics
| Command | Params | What it does |
|---------|--------|-------------|
| `/leaderboard` | [page] | Top 10 members (paginated) |
| `/en-iyi-memurlar` | - | Weekly top list |

### Excuses
| Command | Params | What it does |
|---------|--------|-------------|
| `/mazeret-bildir` | - | Report an excuse (modal) |
| `/mazeretler` | - | View your excuses |

### Units
| Command | Params | What it does |
|---------|--------|-------------|
| `/birim-olustur` | name | Create patrol unit |
| `/birim-ata` | user | Assign member to unit |
| `/birim-notu` | text | Update unit notes |

## 🎨 Colors & Themes

```
Primary Yellow:    #FFD700  🟡
Secondary Orange:  #FF8C00  🟠
Dark Black:        #000000  ⬛
Success Green:     #00FF00  🟢
Error Red:         #FF0000  🔴
Info Blue:         #00BFFF  🔵
```

## 📁 File Structure Quick Ref

```
mesaibot/
├── bot.js              ← Main entry point
├── config.js           ← ALL SETTINGS HERE
├── db.js               ← Database functions
├── commands/           ← Slash commands
├── events/             ← Discord events
├── utils/              ← Helper functions
├── data/               ← Database storage
└── logs/               ← Log files
```

## ⚙️ Key Config Options

```javascript
// config.js

// Colors
colors.primary       // #FFD700 (Yellow)
colors.secondary     // #FF8C00 (Orange)

// Mesai Settings
mesai.autoCheckEnabled      // true
mesai.checkIntervalMs       // 60000 (60 seconds)
mesai.voiceChannelRequired  // true
mesai.shiftTag              // "[M]"

// Logs
logging.categories  // 14+ categories

// Time
time.timezone       // "Europe/Istanbul"
```

## 🚀 Common Tasks

### Start Bot
```bash
npm run dev
```

### Deploy Commands
```bash
node scripts/deploy-commands.js
```

### View Logs
```bash
tail -f logs/bot-*.log
```

### Check Database
```bash
# Database is stored in: data/database.db
# (Quick.db automatically creates it)
```

## 🛠️ Add New Command (5 steps)

1. Create file: `commands/my-command.js`
2. Import what you need
3. Define slash command with `.data`
4. Add `.execute()` function
5. Restart bot (auto-loads!)

See `commands/_TEMPLATE.js` for example.

## 📊 Database Keys Reference

```javascript
// Mesai (Active)
mesai_[GUILD_ID]_[USER_ID]

// User Stats
user_stats_[GUILD_ID]_[USER_ID]

// Excuses
excuse_[TIMESTAMP]

// Units
unit_[TIMESTAMP]

// Penalties
penalty_[TIMESTAMP]

// Guild Settings
guild_settings_[GUILD_ID]

// Logs
logs  (array)
```

## 🔐 Permissions

```javascript
hasPermission(member, "admin")       // Administrator
hasPermission(member, "moderator")   // ManageGuild
hasPermission(member, "operator")    // Operatör role

isAdmin(member, ownerId)             // Admin or owner
hasRole(member, roleName)            // Has specific role
```

## 🎯 Embed Quick Use

```javascript
// Import
import { PremiumEmbed, mesaiEmbeds } from "./utils/embeds.js";

// Use
PremiumEmbed.success("Title", "Description")
PremiumEmbed.error("Title", "Description")
PremiumEmbed.warning("Title", "Description")
PremiumEmbed.info("Title", "Description")

// Or
mesaiEmbeds.shiftStarted(user)
mesaiEmbeds.shiftEnded(user, duration, totalTime)
```

## 📝 Logging Quick Use

```javascript
import logger from "./utils/logger.js";

logger.info("Information");      // ℹ️  Blue
logger.success("Success!");      // ✅ Green
logger.warn("Warning");          // ⚠️  Yellow
logger.error("Error", error);    // ❌ Red
logger.debug("Debug");           // 🐛 Magenta (if DEBUG=true)
```

## 🐛 Common Fixes

| Issue | Solution |
|-------|----------|
| Bot won't start | Check `.env` token is correct |
| Commands not showing | Restart bot, run `npm run deploy-commands` |
| Database errors | Ensure `data/` folder exists |
| Permission denied | Bot needs ADMINISTRATOR permission |
| Embeds look wrong | Check `config.js` color hex values |

## 📞 Support & Geliştirici

- **Geliştirici**: [Luzzysxdd](https://github.com/Luzzysxdd)
- **Documentation**: See `SETUP.md` and `DEVELOPER_GUIDE.md`

---

**Keep this handy for quick reference during development!**

---

*Mesai Bot © 2024-2026 Luzzysxdd*
