"""
Excuses Cog - Excuse/Mazeret management system
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed, create_error_embed, create_warning_embed
from bot import db
import config
from datetime import datetime


class ExcusesCog(commands.Cog):
    """Excuse management commands"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="mazeret-bildir", description="Report an excuse")
    async def submit_excuse(
        self, 
        interaction: discord.Interaction,
        sebep: str,
        tarih: str
    ):
        """Submit an excuse"""
        guild_id = interaction.guild.id
        user_id = interaction.user.id
        
        # Submit excuse to database
        if await db.submit_excuse(guild_id, user_id, sebep, tarih):
            embed = create_success_embed(
                "✅ Mazeret Kaydedildi",
                f"{interaction.user.mention} mazeretiniz başarılı bir şekilde kaydedildi.\n\n**Sebep:** {sebep}\n**Tarih:** {tarih}",
                footer="Mazeret Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
        else:
            embed = create_error_embed(
                "❌ Hata",
                "Mazeret kaydedilemedi. Lütfen daha sonra tekrar deneyin."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
    
    @app_commands.command(name="mazeretler", description="View excuses")
    async def view_excuses(
        self,
        interaction: discord.Interaction,
        durum: str = "tümü"
    ):
        """View excuses with filter"""
        guild_id = interaction.guild.id
        
        # Valid statuses
        valid_statuses = ["tümü", "beklemede", "onaylı", "reddedildi"]
        
        if durum not in valid_statuses:
            embed = create_error_embed(
                "⚠️ Hata",
                f"Geçersiz durum. Geçerli değerler: {', '.join(valid_statuses)}"
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        
        # Get excuses
        if durum == "tümü":
            excuses = await db.get_excuses(guild_id)
        else:
            status_map = {
                "beklemede": "pending",
                "onaylı": "approved",
                "reddedildi": "rejected"
            }
            excuses = await db.get_excuses(guild_id, status_map[durum])
        
        if not excuses:
            embed = create_embed(
                "📋 Mazeretler",
                f"**{durum.upper()}** kategorisinde mazeret bulunmamaktadır.",
                color=config.INFO_COLOR,
                footer="Mazeret Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
            return
        
        # Build excuse list
        embed = create_embed(
            "📋 Mazeret Listesi",
            f"Durum: **{durum.upper()}**",
            color=config.PRIMARY_COLOR,
            footer=f"Toplam: {len(excuses)} mazeret • Mazeret Yönetim Sistemi"
        )
        
        for excuse in excuses[:10]:  # Show max 10
            exc_id, guild_id, user_id, reason, date, status, created_at, approved_by, approved_at = excuse
            member = interaction.guild.get_member(user_id)
            member_name = member.mention if member else f"(ID: {user_id})"
            
            status_emoji = {
                "pending": "⏳",
                "approved": "✅",
                "rejected": "❌"
            }.get(status, "❓")
            
            embed.add_field(
                name=f"{status_emoji} {member_name} - {date}",
                value=f"**Sebep:** {reason}",
                inline=False
            )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="mazeret-onayla", description="Approve an excuse (Admin only)")
    @app_commands.default_permissions(administrator=True)
    async def approve_excuse(
        self,
        interaction: discord.Interaction,
        excuse_id: int
    ):
        """Approve an excuse"""
        guild_id = interaction.guild.id
        
        # Update excuse status
        if await db.update_excuse_status(excuse_id, "approved", interaction.user.id):
            embed = create_success_embed(
                "✅ Mazeret Onaylandı",
                f"Mazeret #{excuse_id} başarıyla onaylanmıştır.",
                footer="Mazeret Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
        else:
            embed = create_error_embed(
                "❌ Hata",
                "Mazeret onaylanamadı."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
    
    @app_commands.command(name="mazeret-reddet", description="Reject an excuse (Admin only)")
    @app_commands.default_permissions(administrator=True)
    async def reject_excuse(
        self,
        interaction: discord.Interaction,
        excuse_id: int
    ):
        """Reject an excuse"""
        guild_id = interaction.guild.id
        
        # Update excuse status
        if await db.update_excuse_status(excuse_id, "rejected", interaction.user.id):
            embed = create_success_embed(
                "✅ Mazeret Reddedildi",
                f"Mazeret #{excuse_id} reddedilmiştir.",
                footer="Mazeret Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
        else:
            embed = create_error_embed(
                "❌ Hata",
                "Mazeret reddedilemedi."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(ExcusesCog(bot))
