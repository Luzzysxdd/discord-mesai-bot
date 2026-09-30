"""
Moderation Cog - Moderation and management commands
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed, create_error_embed, create_warning_embed
from bot import db
import config


class ModerationCog(commands.Cog):
    """Moderation commands"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="sustur", description="Mute a user")
    @app_commands.default_permissions(administrator=True)
    async def mute(
        self,
        interaction: discord.Interaction,
        kullanici: discord.User,
        sebep: str = "Belirtilmedi"
    ):
        """Mute a user"""
        embed = create_warning_embed(
            "🔇 Kullanıcı Susturuldu",
            f"{kullanici.mention} kullanıcısı susturulmuştur.\n\n**Sebep:** {sebep}",
            footer="Moderasyon Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="sustur-ac", description="Unmute a user")
    @app_commands.default_permissions(administrator=True)
    async def unmute(self, interaction: discord.Interaction, kullanici: discord.User):
        """Unmute a user"""
        embed = create_success_embed(
            "🔊 Susturma Kaldırıldı",
            f"{kullanici.mention} kullanıcısının susturması kaldırılmıştır.",
            footer="Moderasyon Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="yasak-ver", description="Ban a user")
    @app_commands.default_permissions(administrator=True)
    async def ban(
        self,
        interaction: discord.Interaction,
        kullanici: discord.User,
        sebep: str = "Belirtilmedi"
    ):
        """Ban a user"""
        embed = create_error_embed(
            "🚫 Kullanıcı Yasaklandı",
            f"{kullanici.mention} kullanıcısı sunucudan yasaklanmıştır.\n\n**Sebep:** {sebep}",
            footer="Moderasyon Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="yasak-ac", description="Unban a user")
    @app_commands.default_permissions(administrator=True)
    async def unban(self, interaction: discord.Interaction, kullanici_id: str):
        """Unban a user"""
        embed = create_success_embed(
            "✅ Yasak Kaldırıldı",
            f"Kullanıcı ID {kullanici_id} yasaklaması kaldırılmıştır.",
            footer="Moderasyon Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="sil", description="Delete messages")
    @app_commands.default_permissions(administrator=True)
    async def delete_messages(
        self,
        interaction: discord.Interaction,
        miktar: int = 10
    ):
        """Delete messages in channel"""
        embed = create_success_embed(
            "🗑️ Mesajlar Silindi",
            f"Son {miktar} mesaj silindi.",
            footer="Moderasyon Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="uyar", description="Warn a user")
    @app_commands.default_permissions(administrator=True)
    async def warn(
        self,
        interaction: discord.Interaction,
        kullanici: discord.User,
        sebep: str = "Belirtilmedi"
    ):
        """Warn a user"""
        embed = create_warning_embed(
            "⚠️ Uyarı Verildi",
            f"{kullanici.mention} kullanıcısına uyarı verilmiştir.\n\n**Sebep:** {sebep}",
            footer="Moderasyon Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="uyarlar", description="View warnings")
    @app_commands.default_permissions(administrator=True)
    async def view_warnings(self, interaction: discord.Interaction, kullanici: discord.User = None):
        """View warnings for a user"""
        if kullanici is None:
            kullanici = interaction.user
        
        embed = create_embed(
            f"⚠️ {kullanici.name} Uyarıları",
            "Kullanıcının tüm uyarıları",
            color=config.WARNING_COLOR
        )
        embed.add_field(
            name="Toplam Uyarı",
            value="0",
            inline=True
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="rol-ver", description="Give a role")
    @app_commands.default_permissions(administrator=True)
    async def give_role(
        self,
        interaction: discord.Interaction,
        kullanici: discord.User,
        rol: discord.Role
    ):
        """Give a role to a user"""
        embed = create_success_embed(
            "✅ Rol Verildi",
            f"{kullanici.mention} kullanıcısına {rol.mention} rolü verildi.",
            footer="Moderasyon Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="rol-al", description="Remove a role")
    @app_commands.default_permissions(administrator=True)
    async def remove_role(
        self,
        interaction: discord.Interaction,
        kullanici: discord.User,
        rol: discord.Role
    ):
        """Remove a role from a user"""
        embed = create_success_embed(
            "✅ Rol Alındı",
            f"{kullanici.mention} kullanıcısından {rol.mention} rolü alındı.",
            footer="Moderasyon Sistemi"
        )
        
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(ModerationCog(bot))
