"""
Units Cog - Patrol unit and assignment management
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed
from bot import db
import config


class UnitsCog(commands.Cog):
    """Unit and patrol management commands"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="birim-olustur", description="Create a patrol unit")
    @app_commands.default_permissions(administrator=True)
    async def create_unit(
        self,
        interaction: discord.Interaction,
        ad: str,
        tip: str = "Standart"
    ):
        """Create a new patrol unit"""
        embed = create_success_embed(
            "🚗 Birim Oluşturuldu",
            f"**Birim Adı:** {ad}\n**Birim Tipi:** {tip}",
            footer="Birim Yönetim Sistemi"
        )
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="birim-ata", description="Assign officer to unit")
    @app_commands.default_permissions(administrator=True)
    async def assign_unit(
        self,
        interaction: discord.Interaction,
        memur: discord.User,
        birim_adi: str
    ):
        """Assign an officer to a unit"""
        embed = create_success_embed(
            "✅ Memur Atandı",
            f"{memur.mention} kullanıcısı **{birim_adi}** birimine atandı.",
            footer="Birim Yönetim Sistemi"
        )
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="birimler", description="Show active units")
    async def active_units(self, interaction: discord.Interaction):
        """Show all active units"""
        embed = create_embed(
            "🚗 Aktif Birimler",
            "Sunucunun tüm aktif birimleri",
            color=config.PRIMARY_COLOR,
            footer="Birim Yönetim Sistemi"
        )
        embed.add_field(
            name="Mevcut Birimler",
            value="Şu anda aktif birim bulunmamaktadır",
            inline=False
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="birim-custom", description="Create custom patrol")
    async def custom_patrol(
        self,
        interaction: discord.Interaction,
        ad: str,
        aciklama: str
    ):
        """Create a custom patrol assignment"""
        embed = create_success_embed(
            "✅ Özel Devriye Oluşturuldu",
            f"**Devriye Adı:** {ad}",
            Açıklama=aciklama,
            footer="Birim Yönetim Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(UnitsCog(bot))
