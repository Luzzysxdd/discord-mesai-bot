# 🚀 VDS & PRODUCTION DEPLOYMENT GUIDE

> **Mesai Bot v2.0** - Production-Ready Deployment Instructions  
> **Framework:** Discord.js v14 | **Process Manager:** PM2  
> **Stability:** Enterprise-Grade with Auto-Recovery

---

## 📋 Pre-Deployment Checklist

- [ ] Bot token from Discord Developer Portal
- [ ] VDS/Server SSH access (for Linux) or RDP (for Windows)
- [ ] Node.js 18+ installed
- [ ] PM2 globally installed (`npm install -g pm2`)
- [ ] `.env` file configured with bot token
- [ ] Firewall allows outbound connections to Discord API

---

## 🖥️ DEPLOYMENT OPTIONS

### Option 1: Windows VDS (Easiest)

#### Step 1: Upload Bot Files
```bash
1. Upload mesaibot/ folder to your Windows VDS
2. Extract if zipped
3. Open PowerShell in the mesaibot folder
```

#### Step 2: Install Dependencies
```powershell
npm install
```

#### Step 3: Configure Environment
```powershell
# Edit .env with your Discord token
notepad .env

# Example .env:
DISCORD_TOKEN=YOUR_TOKEN_HERE
OWNER_IDS=YOUR_ID_HERE
NODE_ENV=production
```

#### Step 4: Start Bot
```powershell
# Double-click start-production.bat
# OR in PowerShell:
.\start-production.bat
```

✅ **Bot is now running with PM2!**

---

### Option 2: Linux VDS (Most Common for Hosting)

#### Step 1: SSH into Your VDS
```bash
ssh root@YOUR_VDS_IP
# or
ssh user@YOUR_VDS_IP
```

#### Step 2: Install Node.js (if not installed)
```bash
# For Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version  # Should be v18+
npm --version   # Should be 8+
```

#### Step 3: Upload Bot Files
```bash
# From your computer:
scp -r mesaibot/ user@YOUR_VDS_IP:/home/user/

# Or clone from GitHub:
cd /home/user
git clone YOUR_REPO_URL mesaibot
cd mesaibot
```

#### Step 4: Install Dependencies
```bash
npm install
```

#### Step 5: Configure Environment
```bash
# Copy template
cp .env.example .env

# Edit with your token
nano .env

# Example .env:
DISCORD_TOKEN=YOUR_TOKEN_HERE
OWNER_IDS=YOUR_ID_HERE
NODE_ENV=production
```

#### Step 6: Make Startup Scripts Executable
```bash
chmod +x start-production.sh
chmod +x scripts/deploy-commands.js
```

#### Step 7: Start Bot
```bash
./start-production.sh
```

#### Step 8: Verify Bot is Running
```bash
pm2 status
pm2 logs mesai-bot  # View live logs
```

✅ **Bot is now running with PM2!**

---

## 📊 PM2 MANAGEMENT COMMANDS

### View Logs
```bash
pm2 logs mesai-bot                    # Live logs
pm2 logs mesai-bot --lines 100        # Last 100 lines
pm2 logs mesai-bot --err              # Error logs only
pm2 flush                             # Clear logs
```

### Check Status
```bash
pm2 status                            # All processes
pm2 show mesai-bot                    # Detailed info
pm2 monit                             # System monitoring
```

### Control Bot
```bash
pm2 restart mesai-bot                 # Restart (0 downtime)
pm2 stop mesai-bot                    # Pause (keep running)
pm2 delete mesai-bot                  # Remove from PM2
pm2 kill                              # Stop all processes
```

### Auto-Start on Boot (Linux)
```bash
pm2 startup systemd -u $USER --hp /home/$USER
pm2 save
```

---

## 🔧 CONFIGURATION

### Environment Variables (.env)

```env
# Discord Bot Token (REQUIRED)
DISCORD_TOKEN=YOUR_TOKEN_HERE

# Owner ID for admin commands
OWNER_IDS=YOUR_DISCORD_ID

# Database Path
DB_PATH=./data/database.db

# Mode
NODE_ENV=production
DEBUG=false

# Logging
LOG_LEVEL=info
```

### Bot Configuration (config.js)

Edit `config.js` for bot settings:

```javascript
// Mesai control loop interval
mesai.checkIntervalMs = 60000  // 60 seconds

// Auto-check settings
mesai.autoCheckEnabled = true
mesai.voiceChannelRequired = true
mesai.gameDetectionEnabled = true

// Allowed games
mesai.allowedGames = ["FiveM", "GTA Online"]

// Exempt roles (per-guild config later)
mesai.exemptRoles = []

// Color theme
colors.primary = "#FFD700"      // Yellow
colors.secondary = "#FF8C00"    // Orange
```

---

## 🛡️ STABILITY FEATURES

### Auto-Recovery ✅
- **Auto-Restart:** Bot automatically restarts on crash
- **Max Restarts:** 10 restarts within uptime period
- **Min Uptime:** 10 seconds (crashes aren't infinite loop)
- **Timeout:** 5 seconds to graceful shutdown before force kill

### Graceful Shutdown ✅
- **SIGTERM/SIGINT:** Bot saves state before shutdown
- **Clean Disconnect:** Waits for active operations
- **Database:** Auto-closes safely
- **Status Update:** Sets bot to offline status

### Memory Management ✅
- **Max Memory:** 500MB restart threshold
- **Memory Limit:** 2GB node process limit
- **Garbage Collection:** Automatic cleanup

### Logging & Monitoring ✅
- **Daily Log Rotation:** `logs/bot-DD-MM-YYYY.log`
- **PM2 Logs:** `logs/pm2-out.log` and `logs/pm2-err.log`
- **14+ Log Categories:** Track all activities
- **Error Tracking:** All unhandled rejections logged

---

## ⚠️ TROUBLESHOOTING

### Bot Not Starting

**Check logs:**
```bash
pm2 logs mesai-bot --err
```

**Common Issues:**

1. **Token Invalid**
   ```
   Error: Invalid token provided
   ```
   → Check `.env` file has correct `DISCORD_TOKEN`

2. **Port Already in Use**
   - Discord.js uses websocket (no local port)
   - Check firewall allows outbound connections

3. **Discord API Rate Limited**
   ```
   Error: 429 Too Many Requests
   ```
   → Bot is sending too many requests
   → Check for duplicate instances
   → Increase interval between checks

4. **Database Lock**
   ```
   Error: database is locked
   ```
   → Close other connections to database
   → Or delete `database.db` and restart (fresh DB)

### Bot Crashes Frequently

**Increase memory:**
```javascript
// In ecosystem.config.js
node_args: "--max-old-space-size=2048"  // 2GB
```

**Increase min uptime:**
```javascript
min_uptime: "30s"  // Require at least 30 seconds of uptime
```

**Check for memory leaks:**
```bash
pm2 monit  # Watch memory over time
```

### Logs Not Saving

**Check directory permissions:**
```bash
ls -la logs/
chmod 755 logs/
chmod 644 logs/*.log
```

**Check disk space:**
```bash
df -h
```

### Discord API Timeouts

**Increase timeout:**
```javascript
// In bot.js REST client
wait_ready: true
listen_timeout: 15000
```

---

## 🔄 UPDATES & MAINTENANCE

### Update Bot Code
```bash
# Stop bot
pm2 stop mesai-bot

# Pull latest code
git pull origin main

# Update dependencies
npm install

# Restart
pm2 restart mesai-bot
```

### Database Backup
```bash
# Backup database
cp data/database.db data/database.db.backup-$(date +%s)

# Or compress
tar -czf database-backup.tar.gz data/

# Download from VDS
scp user@VDS:/home/user/mesaibot/data/database.db ./backup.db
```

### Clean Old Logs
```bash
# Keep only last 30 days of logs
find logs/ -name "bot-*.log" -mtime +30 -delete

# Or manually
rm logs/bot-*.log
```

---

## 📈 PERFORMANCE OPTIMIZATION

### For High-Load Servers

1. **Increase Check Interval:**
   ```javascript
   // In config.js
   mesai.checkIntervalMs = 120000  // 2 minutes instead of 1
   ```

2. **Disable Unnecessary Features:**
   ```javascript
   mesai.gameDetectionEnabled = false  // If not needed
   logging.enabled = false  // If not needed
   ```

3. **Database Optimization:**
   ```bash
   # Remove old data monthly
   # In your command, add expiration logic
   ```

4. **Resource Limits:**
   ```javascript
   // In ecosystem.config.js
   max_memory_restart: "1G"  // Restart if > 1GB
   ```

---

## 🚨 EMERGENCY PROCEDURES

### Bot is Stuck/Frozen
```bash
# Kill and restart
pm2 restart mesai-bot --force

# Or delete and restart
pm2 delete mesai-bot
pm2 start ecosystem.config.js
```

### Database is Corrupted
```bash
# Backup old database
mv data/database.db data/database.db.corrupted

# Bot will create new database on startup
pm2 restart mesai-bot
```

### Need to Restart Server
```bash
# With PM2 auto-startup configured:
# Bot will automatically restart on reboot

# Verify:
pm2 startup systemd -u $USER --hp /home/$USER
```

---

## 📞 GETTING HELP

### Check Bot Status
```bash
# Comprehensive status
pm2 show mesai-bot

# Real-time monitoring
pm2 monit

# Recent logs
pm2 logs mesai-bot --lines 50
```

### Check Discord Connection
- Bot should appear as online in Discord
- Check bot permissions in server settings
- Verify bot has required intents enabled

### Common Discord.js Issues
- Visit: https://discord.js.org/docs/
- Check: https://github.com/discordjs/discord.js/issues

---

## ✅ PRODUCTION CHECKLIST (Before Going Live)

- [ ] `.env` configured with real bot token
- [ ] `NODE_ENV=production` set
- [ ] Logs directory writable
- [ ] Data directory writable
- [ ] PM2 started successfully
- [ ] Bot appears online in Discord
- [ ] Commands work in test server
- [ ] Database initialized (check `data/database.db` exists)
- [ ] PM2 auto-startup configured (for Linux)
- [ ] Firewall allows Discord API connections
- [ ] Server backup strategy in place
- [ ] Log rotation configured
- [ ] Error notifications setup (optional)

---

## 🎉 SUCCESS!

Your Mesai Bot v2.0 is now running in production with:

✅ **Auto-Recovery** - Automatic restart on crash  
✅ **Graceful Shutdown** - Clean disconnection  
✅ **Error Handling** - Comprehensive error tracking  
✅ **Memory Management** - Resource monitoring  
✅ **Logging** - 14+ categories, daily rotation  
✅ **Monitoring** - Real-time PM2 dashboard  
✅ **Production Ready** - Enterprise stability  

---

## 📚 ADDITIONAL RESOURCES

| Resource | URL |
|----------|-----|
| PM2 Docs | https://pm2.keymetrics.io/docs |
| Discord.js v14 | https://discord.js.org/ |
| Node.js LTS | https://nodejs.org/ |
| Linux Systemd | https://wiki.ubuntu.com/systemd |

---

**Version:** 2.0.0  
**Geliştirici:** Luzzysxdd (https://github.com/Luzzysxdd)  
**License:** Custom Attribution Protected

*Mesai Bot - Production Ready*

