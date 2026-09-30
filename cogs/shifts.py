"""
Shifts Cog - Core shift management functionality
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed, create_error_embed
from bot import db
import config


class ShiftsCog(commands.Cog):
    """Shift management commands"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="mesai-gir", description="Start a shift")
    async def shift_start(self, interaction: discord.Interaction):
        """Start a shift"""
        guild_id = interaction.guild.id
        user_id = interaction.user.id
        
        # Check if user is already on shift
        is_on_shift = await db.is_user_on_shift(guild_id, user_id)
        if is_on_shift:
            embed = create_error_embed(
                "⚠️ Hata",
                "Zaten mesaidesiniz!"
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        
        # Check voice channel requirement
        if config.SHIFT_VOICE_CHANNEL_REQUIRED:
            if not interaction.user.voice or not interaction.user.voice.channel:
                embed = create_error_embed(
                    "🎙️ Ses Kanal Gerekli",
                    "Mesaiye girmek için ses kanalında olmanız gerekiyor!"
                )
                await interaction.response.send_message(embed=embed, ephemeral=True)
                return
        
        # Start shift
        if await db.start_shift(guild_id, user_id):
            embed = create_success_embed(
                "✅ Mesai Başladı",
                f"{interaction.user.mention} mesaiye girdi!\n\n**[M] {interaction.user.name}** adında görüneceksiniz.",
                footer="Mesai Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
        else:
            embed = create_error_embed(
                "❌ Hata",
                "Mesai başlatılamadı. Lütfen daha sonra tekrar deneyin."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
    
    @app_commands.command(name="mesai-cikis", description="End your shift")
    async def shift_end(self, interaction: discord.Interaction):
        """End a shift"""
        guild_id = interaction.guild.id
        user_id = interaction.user.id
        
        # Check if user is on shift
        is_on_shift = await db.is_user_on_shift(guild_id, user_id)
        if not is_on_shift:
            embed = create_error_embed(
                "⚠️ Hata",
                "Mesaide değilsiniz!"
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
            return
        
        # End shift
        if await db.end_shift(guild_id, user_id):
            embed = create_success_embed(
                "✅ Mesai Bitti",
                f"{interaction.user.mention} mesaiden çıktı!",
                footer="Mesai Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
        else:
            embed = create_error_embed(
                "❌ Hata",
                "Mesai bitirilmedi. Lütfen daha sonra tekrar deneyin."
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
    
    @app_commands.command(name="aktif-memurlar", description="Show active officers")
    async def active_officers(self, interaction: discord.Interaction):
        """Show all active officers"""
        guild_id = interaction.guild.id
        
        active_shifts = await db.get_active_shifts(guild_id)
        
        if not active_shifts:
            embed = create_embed(
                "📋 Aktif Memurlar",
                "Şu anda aktif memur bulunmamaktadır.",
                color=config.INFO_COLOR,
                footer="Mesai Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
            return
        
        # Build list of active officers
        officers_list = []
        for user_id, started_at in active_shifts:
            member = interaction.guild.get_member(user_id)
            if member:
                officers_list.append(f"• **[M] {member.name}** - <t:{int(started_at.timestamp())}:R>")
        
        embed = create_embed(
            "📋 Aktif Memurlar",
            f"**👥 Toplam: {len(officers_list)} memur**\n\n" + "\n".join(officers_list),
            color=config.PRIMARY_COLOR,
            footer="Mesai Yönetim Sistemi"
        )
        await interaction.response.send_message(embed=embed)
    
    @commands.Cog.listener()
    async def on_voice_state_update(self, member, before, after):
        """Track voice channel changes"""
        # This could be used for automatic shift management based on voice status
        pass


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(ShiftsCog(bot))

