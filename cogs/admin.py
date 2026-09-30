"""
Admin Cog - Administrative commands
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed, create_info_embed
from bot import db
import config


class AdminCog(commands.Cog):
    """Administrative commands"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="toplu-cikis", description="Bulk remove all from shift")
    @app_commands.default_permissions(administrator=True)
    async def bulk_exit(self, interaction: discord.Interaction):
        """Remove all active officers from shift"""
        guild_id = interaction.guild.id
        
        # Get all active shifts
        active_shifts = await db.get_active_shifts(guild_id)
        
        if not active_shifts:
            embed = create_info_embed(
                "ℹ️ Bilgi",
                "Mesaide olan memur bulunmamaktadır.",
                footer="Mesai Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
            return
        
        # Remove all from shift
        removed_count = 0
        for user_id, _ in active_shifts:
            if await db.end_shift(guild_id, user_id):
                removed_count += 1
        
        embed = create_success_embed(
            "✅ Toplu Çıkış Gerçekleştirildi",
            f"**{removed_count} memur** mesaiden çıkarıldı.",
            footer="Mesai Yönetim Sistemi"
        )
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="sunucu-ayarlar", description="Guild settings")
    @app_commands.default_permissions(administrator=True)
    async def guild_settings(self, interaction: discord.Interaction):
        """Show guild settings"""
        embed = create_embed(
            "⚙️ Sunucu Ayarları",
            "Mesai Bot Ayarları",
            color=config.PRIMARY_COLOR,
            footer="Mesai Yönetim Sistemi"
        )
        embed.add_field(name="🎙️ Ses Kanal Gerekli", value=str(config.SHIFT_VOICE_CHANNEL_REQUIRED), inline=True)
        embed.add_field(name="🎮 Oyun Kontrolü", value=str(config.SHIFT_GAME_CHECK_ENABLED), inline=True)
        embed.add_field(name="📊 İnaktiflik Eşiği", value=f"{config.INACTIVITY_WARNING_DAYS} gün", inline=True)
        embed.add_field(name="🎫 Ticket Sistemi", value=str(config.TICKET_ENABLED), inline=True)
        embed.add_field(name="⚖️ Ceza Sistemi", value=str(config.PENALTY_ENABLED), inline=True)
        embed.add_field(name="🎉 Etkinlik Sistemi", value=str(config.EVENT_ENABLED), inline=True)
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="bot-info", description="Bot information")
    async def show_info(self, interaction: discord.Interaction):
        """Show bot information"""
        embed = create_embed(
            "🤖 Mesai Bot Bilgileri",
            config.DEVELOPER_CREDITS,
            color=config.PREMIUM_COLOR,
            footer="Mesai Yönetim Sistemi"
        )
        embed.add_field(name="📌 Versiyon", value=config.BOT_VERSION, inline=True)
        embed.add_field(name="👥 Sunucular", value=str(len(interaction.client.guilds)), inline=True)
        embed.add_field(name="💾 Veritabanı", value="SQLite (aiosqlite)", inline=True)
        
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(AdminCog(bot))
