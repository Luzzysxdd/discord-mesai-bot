#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🚀 START MESAI BOT - PRODUCTION MODE (Linux/VDS)
# ═══════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🤖 MESAI BOT - PRODUCTION STARTUP (Linux/VDS)           ║"
echo "║  Version 2.0.0 | Discord.js v14 | PM2 Manager           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js not found!"
    echo "   Please install Node.js 18+ using:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo "📦 Installing PM2 globally..."
    sudo npm install -g pm2
    echo "✅ PM2 installed"
else
    echo "✅ PM2 found globally"
fi

echo ""
echo "📁 Checking directories..."

mkdir -p data
mkdir -p logs

echo "✅ Directories ready"

echo ""
echo "🔧 Checking .env file..."

if [ ! -f ".env" ]; then
    echo "❌ ERROR: .env file not found!"
    echo ""
    echo "📝 Creating .env from template..."
    cp .env.example .env
    echo "⚠️  PLEASE EDIT .env WITH YOUR DISCORD TOKEN!"
    echo "   Command: nano .env"
    exit 1
fi

echo "✅ .env file exists"

echo ""
echo "🚀 Starting Mesai Bot with PM2..."
echo "   (Production mode with auto-restart and monitoring)"
echo ""

# Set production environment
export NODE_ENV=production

# Start with PM2
pm2 start ecosystem.config.js --name mesai-bot

# Save PM2 config for auto-startup
pm2 save

echo ""
echo "✅ Bot started!"
echo ""
echo "📊 Monitoring commands:"
echo "   pm2 logs mesai-bot        - View live logs"
echo "   pm2 status                - Check bot status"
echo "   pm2 monit                 - Monitor resource usage"
echo "   pm2 restart mesai-bot     - Restart bot"
echo "   pm2 stop mesai-bot        - Stop bot"
echo ""

# Optional: Setup PM2 auto-startup on boot
echo ""
echo "🔄 Setup auto-startup on server restart? (y/n)"
read -r response
if [[ "$response" == "y" ]] || [[ "$response" == "Y" ]]; then
    echo ""
    echo "Setting up PM2 to auto-start on boot..."
    pm2 startup systemd -u $USER --hp /home/$USER
    pm2 save
    echo "✅ PM2 auto-startup configured"
fi

echo ""
echo "🌐 Your bot should now be online!"
echo ""
