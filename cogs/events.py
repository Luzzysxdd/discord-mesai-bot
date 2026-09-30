"""
Events Cog - Event creation and management system
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed
from bot import db
import config
from datetime import datetime, timedelta


class EventsCog(commands.Cog):
    """Event creation and management"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="etkinlik-olustur", description="Create an event")
    @app_commands.default_permissions(administrator=True)
    async def create_event(
        self,
        interaction: discord.Interaction,
        ad: str,
        aciklama: str,
        tarih: str
    ):
        """Create a new event"""
        embed = create_success_embed(
            "🎉 Etkinlik Oluşturuldu",
            f"**Etkinlik:** {ad}\n**Açıklama:** {aciklama}\n**Tarih:** {tarih}",
            footer="Etkinlik Yönetim Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="etkinlikler", description="View all events")
    async def view_events(self, interaction: discord.Interaction, sayfa: int = 1):
        """View all events"""
        embed = create_embed(
            "🎉 Etkinlikler",
            "Tüm sunucu etkinlikleri burada gösterilir",
            color=config.PRIMARY_COLOR
        )
        embed.add_field(
            name="Yaklaşan Etkinlikler",
            value="Etkinlik bulunmamaktadır",
            inline=False
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="etkinlik-sil", description="Cancel an event")
    @app_commands.default_permissions(administrator=True)
    async def cancel_event(
        self,
        interaction: discord.Interaction,
        etkinlik_id: int
    ):
        """Cancel an event"""
        embed = create_success_embed(
            "🔔 Etkinlik İptal Edildi",
            f"Etkinlik #{etkinlik_id} iptal edilmiştir.",
            footer="Etkinlik Yönetim Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="etkinlik-katil", description="Join an event")
    async def join_event(
        self,
        interaction: discord.Interaction,
        etkinlik_id: int
    ):
        """Join an event"""
        embed = create_success_embed(
            "✅ Etkinliğe Katılındı",
            f"Etkinlik #{etkinlik_id}'ye katıldiniz. Lütfen zamanında gelin!",
            footer="Etkinlik Yönetim Sistemi"
        )
        
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(EventsCog(bot))
