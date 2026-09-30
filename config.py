"""
Configuration and constants for Mesai Bot
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Discord Bot Settings
DISCORD_TOKEN = os.getenv("DISCORD_TOKEN", "")
COMMAND_PREFIX = "/"
BOT_INTENTS = {
    "message_content": True,
    "members": True,
    "voice_states": True,
    "guilds": True,
}

# Developer Info
DEVELOPER_CREDITS = "Developed By **Luzzysxdd** (https://github.com/Luzzysxdd)"
BOT_VERSION = "2.0.0"

# Database
DATABASE_PATH = os.getenv("DATABASE_PATH", "./data/mesaibot.db")

# Shift Settings
SHIFT_ACTIVITY_CHECK_ENABLED = True
SHIFT_VOICE_CHANNEL_REQUIRED = True
SHIFT_GAME_CHECK_ENABLED = False  # Will be enabled with web integration
SHIFT_EXEMPT_ROLES = []  # Will be set per guild

# Leaderboard Settings
LEADERBOARD_UPDATE_INTERVAL = 300  # 5 minutes in seconds
LEADERBOARD_REFRESH_RATE = 60  # Seconds between updates

# Inactivity Monitoring
INACTIVITY_WARNING_DAYS = 2
INACTIVITY_CHECK_INTERVAL = 86400  # 24 hours in seconds

# Time Settings
HOURLY_REPORT_INTERVAL = 3600  # 1 hour in seconds

# Ticket Settings
TICKET_ENABLED = True
TICKET_SUPPORT_ROLE = None  # Will be set per guild
TICKET_CATEGORY_NAME = "📋-Tickets"

# Penalty Settings
PENALTY_ENABLED = True
MAX_PENALTY_POINTS = 100

# Activity Test Settings
ACTIVITY_TEST_ENABLED = True
ACTIVITY_TEST_INTERVAL = 86400  # Daily

# Event Settings
EVENT_ENABLED = True
MAX_EVENTS = 50

# Message Settings - Color Palette (Modern)
EMBED_COLOR = 0x2B2D31  # Dark theme
PRIMARY_COLOR = 0x5865F2  # Discord Blue
SUCCESS_COLOR = 0x57F287  # Green
ERROR_COLOR = 0xED4245  # Red
WARNING_COLOR = 0xFAA61A  # Orange
INFO_COLOR = 0x00B0F4  # Light Blue
PREMIUM_COLOR = 0xF26522  # Orange/Gold

# Pagination
ITEMS_PER_PAGE = 10
ITEMS_PER_LEADERBOARD_PAGE = 15
