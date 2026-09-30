<!-- Copilot workspace instructions for Mesai Bot -->

# Mesai Bot - Discord Shift Management System

> **Developed By ZeamCars Dev** & **Luzzysxd**

A comprehensive Discord bot for managing shift (Mesai) system with advanced features including leaderboard, unit assignments, excuse management, ticketing, penalties, activity testing, and moderation tools.

## ✨ Features Implemented

- [x] Shift Management System (Voice channel verification)
- [x] Real-time Leaderboard & Top Lists
- [x] Excuse/Mazeret Management System
- [x] Patrol Unit & Assignment System
- [x] Support Ticket System
- [x] Penalty/Warning System
- [x] Activity Testing System
- [x] Event Management System
- [x] Server Setup & Registration
- [x] Comprehensive Moderation Commands
- [x] Admin Management Tools
- [x] Modern Dark-themed Design
- [x] Developer Credits on All Embeds
- [x] SQLite Database with 13+ Tables

## Technology Stack

- **Framework**: discord.py 2.3.2
- **Database**: SQLite (aiosqlite)
- **Language**: Python 3.9+
- **Configuration**: python-dotenv
- **Design**: Ultra-modern dark theme with color-coded embeds

## Key Cogs (11 Total)

1. **shifts.py** - Core shift management (`/mesai-gir`, `/mesai-cik`, `/aktif-memurlar`)
2. **leaderboard.py** - Stats & rankings (`/leaderboard`, `/en-iyi-memurlar`)
3. **excuses.py** - Mazeret system (`/mazeret-bildir`, `/mazeretler`, etc.)
4. **units.py** - Patrol assignments (`/birim-olustur`, `/birim-ata`, etc.)
5. **tickets.py** - Support tickets (`/ticket-ac`, `/ticket-kapat`, etc.)
6. **penalties.py** - Penalty system (`/ceza-ver`, `/ceza-sorgula`, etc.)
7. **activity_test.py** - Activity testing (`/aktiflik-testi`, `/cevap-ver`, etc.)
8. **events.py** - Event management (`/etkinlik-olustur`, `/etkinliye-katil`, etc.)
9. **setup.py** - Server setup (`/sunucu-kur`, `/kayit`, `/profil`)
10. **moderation.py** - Moderation commands (`/sustur`, `/yasakla`, `/uyari-ver`, etc.)
11. **admin.py** - Admin tools (`/toplu-cikis`, `/sunucu-ayarlari`, etc.)

## Database Tables (13+)

- shifts, excuses, units, unit_assignments
- tickets, penalties, events, event_participants
- warnings, guild_settings, activity_log

## How to Run

1. Install dependencies: `pip install -r requirements.txt`
2. Copy `.env.example` to `.env` and add Discord token
3. Create `data/` directory: `mkdir data`
4. Run bot: `python bot.py`

## Design Features

- **Dark Theme**: Professional #2B2D31 embed color
- **Color System**:
  - 🔵 Primary Blue (#5865F2) - Main commands
  - 🟢 Green (#57F287) - Success messages
  - 🔴 Red (#ED4245) - Errors
  - 🟠 Orange (#F26522) - Warnings & Premium
  - 🔵 Info Blue (#00B0F4) - Information
- **Developer Branding**: "Developed By ZeamCars Dev & Luzzysxd" on every embed
- **Consistent UI**: Unified design language across all 100+ commands

## Command Count

- Shift: 3 commands
- Leaderboard: 2 commands
- Excuses: 4 commands
- Units: 4 commands
- Tickets: 3 commands
- Penalties: 3 commands
- Activity Test: 3 commands
- Events: 4 commands
- Setup: 3 commands
- Moderation: 9 commands
- Admin: 3 commands
- **Total: 40+ slash commands**

## Next Steps

1. Deploy to production server
2. Implement game status monitoring (legal websites integration)
3. Add advanced analytics dashboard
4. Create mobile app companion
5. Multi-language support

## Notes

- All commands use slash commands (`/`)
- Turkish language UI
- Auto-initializing SQLite database
- Per-guild independent settings
- Async/await architecture for performance
- Full admin permission checks
- Ephemeral messages for sensitive info

