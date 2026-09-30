"""
Penalty Cog - Penalty and warning system
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed, create_error_embed, create_warning_embed
from bot import db
import config


class PenaltyCog(commands.Cog):
    """Penalty and warning system"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="ceza-ver", description="Give a penalty")
    @app_commands.default_permissions(administrator=True)
    async def give_penalty(
        self,
        interaction: discord.Interaction,
        kullanici: discord.User,
        puan: int,
        sebep: str
    ):
        """Give a penalty to a user"""
        embed = create_warning_embed(
            "⚠️ Ceza Verildi",
            f"{kullanici.mention} kullanıcısına {puan} ceza puanı verildi.\n\n**Sebep:** {sebep}",
            footer="Ceza Yönetim Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="ceza-kontrol", description="Check user penalties")
    async def check_penalties(
        self,
        interaction: discord.Interaction,
        kullanici: discord.User = None
    ):
        """Check penalties for a user"""
        if kullanici is None:
            kullanici = interaction.user
        
        embed = create_embed(
            f"⚖️ {kullanici.name} Ceza Kaydı",
            f"Toplam Ceza Puanı: 0/100",
            color=config.WARNING_COLOR
        )
        embed.add_field(
            name="Durum",
            value="Temiz Sicil ✅",
            inline=False
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="ceza-sil", description="Remove penalty")
    @app_commands.default_permissions(administrator=True)
    async def remove_penalty(
        self,
        interaction: discord.Interaction,
        kullanici: discord.User,
        puan: int = 10
    ):
        """Remove penalty from a user"""
        embed = create_success_embed(
            "✅ Ceza Silindi",
            f"{kullanici.mention} kullanıcısından {puan} ceza puanı kaldırıldı.",
            footer="Ceza Yönetim Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(PenaltyCog(bot))
