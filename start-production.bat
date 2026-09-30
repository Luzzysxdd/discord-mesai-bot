@echo off
REM ═══════════════════════════════════════════════════════════════
REM 🚀 START MESAI BOT - PRODUCTION MODE (Windows)
REM ═══════════════════════════════════════════════════════════════

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🤖 MESAI BOT - PRODUCTION STARTUP (Windows)             ║
echo ║  Version 2.0.0 | Discord.js v14 | PM2 Manager           ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js not found!
    echo    Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected: 
node --version

REM Check if PM2 is installed globally
pm2 -v >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo 📦 Installing PM2 globally...
    call npm install -g pm2
    echo ✅ PM2 installed
) else (
    echo ✅ PM2 found globally
)

echo.
echo 📁 Checking directories...

if not exist "data" mkdir data
if not exist "logs" mkdir logs

echo ✅ Directories ready

echo.
echo 🔧 Checking .env file...

if not exist ".env" (
    echo ❌ ERROR: .env file not found!
    echo.
    echo 📝 Creating .env from template...
    copy .env.example .env
    echo ⚠️  PLEASE EDIT .env WITH YOUR DISCORD TOKEN!
    echo    Command: notepad .env
    pause
    exit /b 1
)

echo ✅ .env file exists

echo.
echo 🚀 Starting Mesai Bot with PM2...
echo    (Production mode with auto-restart and monitoring)
echo.

REM Set production environment
setlocal enabledelayedexpansion
set NODE_ENV=production

REM Start with PM2
call pm2 start ecosystem.config.js --name mesai-bot

echo.
echo ✅ Bot started!
echo.
echo 📊 Monitoring commands:
echo    pm2 logs mesai-bot        - View live logs
echo    pm2 status                - Check bot status
echo    pm2 monit                 - Monitor resource usage
echo    pm2 restart mesai-bot     - Restart bot
echo    pm2 stop mesai-bot        - Stop bot
echo    pm2 delete mesai-bot      - Remove from PM2
echo.
echo 🌐 Your bot should now be online!
echo.

pause
