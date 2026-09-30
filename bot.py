"""
Mesai Bot - Shift Management System for Discord
Main bot entry point
"""
import discord
from discord.ext import commands
import os
import asyncio
from pathlib import Path
import config
from database.models import Database

# Setup bot with intents
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
intents.voice_states = True
intents.guilds = True

bot = commands.Bot(command_prefix=config.COMMAND_PREFIX, intents=intents)

# Database instance
db = None


async def load_cogs():
    """Load all cogs from the cogs directory"""
    cogs_dir = Path("cogs")
    for filename in cogs_dir.glob("*.py"):
        if filename.name.startswith("_"):
            continue
        cog_name = filename.stem
        try:
            await bot.load_extension(f"cogs.{cog_name}")
            print(f"✓ Loaded cog: {cog_name}")
        except Exception as e:
            print(f"✗ Failed to load cog {cog_name}: {e}")


@bot.event
async def on_ready():
    """Called when bot is ready"""
    try:
        synced = await bot.tree.sync()
        print(f"✓ Synced {len(synced)} command(s)")
    except Exception as e:
        print(f"✗ Failed to sync commands: {e}")
    
    print(f"✓ Bot logged in as {bot.user}")
    print(f"✓ Bot is in {len(bot.guilds)} guild(s)")
    print("-" * 50)


@bot.event
async def on_guild_join(guild):
    """Called when bot joins a new guild"""
    print(f"✓ Joined guild: {guild.name} (ID: {guild.id})")


async def main():
    """Main bot startup function"""
    global db
    
    # Initialize database
    db = Database(config.DATABASE_PATH)
    await db.initialize()
    print("✓ Database initialized")
    
    # Load cogs
    await load_cogs()
    
    # Start the bot with better error handling
    try:
        print(f"Attempting to connect to Discord...")
        print(f"Token: {config.DISCORD_TOKEN[:20]}...")
        await bot.start(config.DISCORD_TOKEN)
    except Exception as e:
        import traceback
        print(f"✗ Failed to start bot: {e}")
        print("Traceback:")
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
