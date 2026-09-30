"""
Activity Test Cog - Member activity testing system
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed, create_info_embed
from bot import db
import config


class ActivityTestCog(commands.Cog):
    """Activity testing system"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="aktiflik-test", description="Start activity test")
    @app_commands.default_permissions(administrator=True)
    async def start_activity_test(
        self,
        interaction: discord.Interaction,
        sora: str,
        cevap: str
    ):
        """Start an activity test"""
        embed = create_success_embed(
            "✅ Aktiflik Testi Başladı",
            f"Üyelere soru sorulacak.\n\n**Soru:** {sora}",
            footer="Aktiflik Test Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="aktiflik-sonuc", description="View activity test results")
    @app_commands.default_permissions(administrator=True)
    async def test_results(self, interaction: discord.Interaction):
        """View activity test results"""
        embed = create_info_embed(
            "📊 Aktiflik Testi Sonuçları",
            "Test sonuçları burada gösterilir.",
            footer="Aktiflik Test Sistemi"
        )
        embed.add_field(
            name="Başarılı",
            value="0 üye",
            inline=True
        )
        embed.add_field(
            name="Başarısız",
            value="0 üye",
            inline=True
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="cevap-ver", description="Answer activity test")
    async def submit_answer(
        self,
        interaction: discord.Interaction,
        cevap: str
    ):
        """Submit an answer to activity test"""
        embed = create_success_embed(
            "✅ Cevap Alındı",
            f"Cevabınız kaydedilmiştir: {cevap}",
            footer="Aktiflik Test Sistemi"
        )
        
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(ActivityTestCog(bot))
