#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🚀 QUICK SETUP SCRIPT
# ═══════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════════"
echo "  🤖 MESAI BOT - Quick Setup"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p data
mkdir -p logs
mkdir -p commands
mkdir -p events
mkdir -p utils
mkdir -p scripts
echo "✅ Directories created"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your Discord token:"
    echo "   1. Open .env"
    echo "   2. Replace YOUR_BOT_TOKEN_HERE with your token"
    echo "   3. Save the file"
    echo ""
    read -p "Press Enter when you've updated .env..."
fi

echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✨ Setup Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Update config.js with your server settings"
echo "  2. Run: npm start (or npm run dev for development)"
echo "  3. Commands will auto-register when bot starts"
echo ""
echo "For help, see SETUP.md"
echo ""
