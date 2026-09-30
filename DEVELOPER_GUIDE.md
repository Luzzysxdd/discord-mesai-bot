# 📚 DEVELOPER GUIDE - Mesai Bot Architecture

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│         DISCORD BOT (Discord.js v14)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Commands   │  │    Events    │  │   Listeners  │  │
│  │   (40+)      │  │   Handlers   │  │   (Buttons)  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                 │          │
│         └─────────────────┼─────────────────┘          │
│                           │                            │
│         ┌─────────────────▼─────────────────┐          │
│         │    Core Bot Logic (bot.js)        │          │
│         │  - Slash Command Handler          │          │
│         │  - Shift Control Loop (60s)       │          │
│         │  - Event Management               │          │
│         └─────────────────┬─────────────────┘          │
│                           │                            │
│  ┌────────────────────────┼────────────────────────┐   │
│  │                        │                        │   │
│  │  ┌───────────────┐  ┌──▼──────────────┐        │   │
│  │  │   Database    │  │   Utilities     │        │   │
│  │  │  (Quick.db)   │  │ - Embeds        │        │   │
│  │  │  - Models     │  │ - Helpers       │        │   │
│  │  │  - Functions  │  │ - Logger        │        │   │
│  │  └───────────────┘  └─────────────────┘        │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Discord   │
                    │  API/Event  │
                    └─────────────┘
```

## 🔄 Mesai Control Loop

```
Every 60 seconds (configurable):
┌───────────────────────────────────┐
│  Get All Active Shifts in Guild   │
└───────────────┬───────────────────┘
                │
                ▼
        ┌───────────────────────┐
        │ For Each Active User  │
        └───────────┬───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   ┌─────────────────┐   ┌─────────────────┐
   │ Check 1:        │   │ Check 2:        │
   │ Voice Channel?  │   │ Game Playing?   │
   │                 │   │                 │
   │ ✅ In Channel   │   │ ✅ Allowed Game │
   │ ❌ Left → KICK  │   │ ❌ Not Allowed  │
   │    (End Shift)  │   │    → LOG/WARN   │
   └─────────────────┘   └─────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │ Check 3:              │
        │ Exempt Role?          │
        │                       │
        │ ✅ Exempt → SKIP      │
        │ ❌ No Exempt → NORMAL │
        └───────────────────────┘
```

## 📊 Database Schema

```
Quick.db Collections:

MESAI DATA:
├── mesai_[GUILD_ID]_[USER_ID]
│   ├── userId
│   ├── guildId
│   ├── startTime (timestamp)
│   └── isActive (boolean)
│
├── mesai_history (array)
│   └── [{userId, guildId, startTime, endTime, duration}]
│
└── user_stats_[GUILD_ID]_[USER_ID]
    ├── totalShiftTime (ms)
    ├── shiftsCompleted
    └── lastShiftTime

EXCUSES:
├── excuse_[TIMESTAMP]
│   ├── userId
│   ├── guildId
│   ├── reason
│   ├── status (pending/approved/rejected)
│   └── reviewedBy

UNITS:
├── unit_[TIMESTAMP]
│   ├── guildId
│   ├── name
│   ├── type
│   ├── leader
│   ├── members (array)
│   └── notes

PENALTIES:
└── penalty_[TIMESTAMP]
    ├── userId
    ├── points
    └── reason

SETTINGS:
└── guild_settings_[GUILD_ID]
    ├── mesaiChannelId
    ├── logsChannelId
    └── exemptRoles
```

## 🎨 Embed System Flow

```
┌──────────────────────────────────┐
│  Command/Event Triggered         │
└──────────────┬───────────────────┘
               │
               ▼
       ┌───────────────────┐
       │ Choose Embed Type │
       └───────┬───────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
 Success    Warning     Error
   (🟢)       (🟠)       (🔴)
    │          │          │
    └──────────┼──────────┘
               │
               ▼
    ┌────────────────────────┐
    │  Set Color & Fields    │
    │  - Title              │
    │  - Description        │
    │  - Footer             │
    │  - Timestamp          │
    └────────────────────────┘
               │
               ▼
    ┌────────────────────────┐
    │  Add Components        │
    │  - Buttons (Optional)  │
    │  - Select Menus        │
    │  - Modals              │
    └────────────────────────┘
               │
               ▼
    ┌────────────────────────┐
    │  Send to Discord       │
    └────────────────────────┘
```

## 🛠️ Command Structure

```javascript
// Minimal Command
export default {
  data: new SlashCommandBuilder()
    .setName("command-name")
    .setDescription("Command description"),
  
  async execute(interaction, bot) {
    // Your logic here
  }
}

// With Options
data: new SlashCommandBuilder()
  .addStringOption(opt => 
    opt.setName("name").setDescription("...")
  )
  .addIntegerOption(opt =>
    opt.setName("number").setDescription("...")
  )
  .addUserOption(opt =>
    opt.setName("user").setDescription("...")
  )

// Get Options
interaction.options.getString("name")
interaction.options.getInteger("number")
interaction.options.getUser("user")
interaction.options.getMember("member")
```

## 🔌 Event Handlers

```javascript
// Event Handler Structure
export default {
  name: "eventName",        // Discord event name
  once: false,              // true = only once, false = every time
  
  async execute(bot, ...args) {
    // args depend on event type
    // For "ready": (bot)
    // For "voiceStateUpdate": (bot, oldState, newState)
    // For "messageCreate": (bot, message)
  }
}

// Available Events
- ready
- voiceStateUpdate
- messageCreate
- guildMemberAdd
- guildMemberRemove
- interactionCreate
```

## 💾 Database Operations

```javascript
import { mesaiDB, leaderboardDB, excuseDB, unitDB, penaltyDB } from "./db.js";

// Mesai Operations
mesaiDB.startShift(userId, guildId)           // Start
mesaiDB.endShift(userId, guildId)             // End
mesaiDB.isUserInShift(userId, guildId)        // Check
mesaiDB.getActiveUsers(guildId)               // List all

// User Stats
mesaiDB.getUserTotalTime(userId, guildId)     // Get total ms

// Leaderboard
leaderboardDB.getLeaderboard(guildId, page, 10)
leaderboardDB.getTop10(guildId)

// Excuses
excuseDB.addExcuse(userId, guildId, reason)
excuseDB.reviewExcuse(excuseId, "approve", reviewBy)
excuseDB.getUserExcuses(userId, guildId)

// Units
unitDB.createUnit(guildId, name, type)
unitDB.addMemberToUnit(unitId, userId)
unitDB.updateUnitNotes(unitId, notes)

// Penalties
penaltyDB.addPenalty(userId, guildId, points, reason, issuedBy)
penaltyDB.getUserPenaltyPoints(userId, guildId)
```

## 🎯 Common Patterns

### Error Handling
```javascript
try {
  // Your code
} catch (error) {
  logger.error("Error message:", error);
  
  const errorEmbed = PremiumEmbed.error(
    "Error Title",
    `Hata: ${error.message}`
  );
  
  interaction.reply({ embeds: [errorEmbed], ephemeral: true });
}
```

### Button Interactions
```javascript
const collector = message.createMessageComponentCollector({
  time: 60000 // 1 minute
});

collector.on("collect", async (btnInteraction) => {
  if (btnInteraction.customId === "button_id") {
    // Handle button
  }
});
```

### Pagination
```javascript
// Get page
const data = leaderboardDB.getLeaderboard(guildId, page, 10);

// Create next/prev buttons
if (page > 1) addPrevButton();
if (page < data.totalPages) addNextButton();
```

## 📖 Logging Best Practices

```javascript
import logger from "./utils/logger.js";

// Log levels
logger.info("General information");
logger.success("Operation succeeded");
logger.warn("Warning message");
logger.error("Error occurred", error);
logger.debug("Debug info (if DEBUG=true)");

// Logs automatically save to:
// logs/bot-DD-MM-YYYY.log
```

## 🚀 Deployment Checklist

- [ ] Update `.env` with bot token and IDs
- [ ] Configure `config.js` with server settings
- [ ] Create necessary Discord roles (`[M]` tag, etc.)
- [ ] Set bot permissions to ADMINISTRATOR
- [ ] Test all commands locally
- [ ] Deploy to production server
- [ ] Monitor logs for errors
- [ ] Set up daily backups

## 🔐 Security Tips

1. **Never commit `.env`** - Keep tokens safe
2. **Validate user input** - Check all command parameters
3. **Permission checks** - Always verify admin/operator roles
4. **Rate limiting** - Implement cooldowns for commands
5. **Error logging** - Log all errors for debugging
6. **Database backups** - Regular backups of `database.db`

---

**For more help, refer to SETUP.md or contact the development team.**
