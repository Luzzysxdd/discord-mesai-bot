"""
Ticket Cog - Support ticket system
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed, create_error_embed
from bot import db
import config


class TicketCog(commands.Cog):
    """Support ticket system"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="ticket-aç", description="Open a support ticket")
    async def open_ticket(
        self,
        interaction: discord.Interaction,
        baslik: str,
        aciklama: str
    ):
        """Open a new support ticket"""
        user_id = interaction.user.id
        guild_id = interaction.guild.id
        
        embed = create_success_embed(
            "🎫 Ticket Açıldı",
            f"Destek talebiniz açılmıştır.\n\n**Başlık:** {baslik}\n**Açıklama:** {aciklama}",
            footer="Destek ekibimiz en kısa sürede yanıtlayacak"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="ticket-kapat", description="Close a ticket")
    async def close_ticket(self, interaction: discord.Interaction):
        """Close a support ticket"""
        embed = create_success_embed(
            "✅ Ticket Kapatıldı",
            "Destek talebiniz kapatılmıştır. Bizi tercih ettiğiniz için teşekkürler!",
            footer="Herhangi bir sorun varsa yeniden ticket açabilirsiniz"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="tickets", description="View all tickets")
    @app_commands.default_permissions(administrator=True)
    async def view_tickets(self, interaction: discord.Interaction):
        """View all open tickets"""
        embed = create_embed(
            "🎫 Açık Tickets",
            "Tüm destek taleplerini görmek için komut çalıştırıldı",
            color=config.PRIMARY_COLOR,
            footer="Ticket yönetim sistemi"
        )
        
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(TicketCog(bot))
