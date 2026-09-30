"""
Leaderboard Cog - Shift leaderboard and statistics
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_info_embed, paginate_list
from bot import db
import config


class LeaderboardCog(commands.Cog):
    """Leaderboard and statistics commands"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="leaderboard", description="Show shift leaderboard")
    async def leaderboard(self, interaction: discord.Interaction, sayfa: int = 1):
        """Show shift leaderboard"""
        guild_id = interaction.guild.id
        
        # Get active shifts
        active_shifts = await db.get_active_shifts(guild_id)
        
        if not active_shifts:
            embed = create_info_embed(
                "📊 Leaderboard",
                "Şu anda aktif memur bulunmamaktadır.",
                footer="Mesai Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
            return
        
        # Build leaderboard data
        leaderboard_data = []
        for user_id, started_at in active_shifts:
            member = interaction.guild.get_member(user_id)
            if member:
                leaderboard_data.append((member, started_at))
        
        # Paginate results
        paginated, current_page, total_pages = await paginate_list(
            leaderboard_data, sayfa, config.ITEMS_PER_LEADERBOARD_PAGE
        )
        
        # Build embed
        embed = create_embed(
            "📊 Aktif Memurlar Leaderboard",
            f"Toplam: {len(leaderboard_data)} aktif memur",
            color=config.PRIMARY_COLOR,
            footer=f"Sayfa {current_page}/{total_pages} • Mesai Yönetim Sistemi"
        )
        
        for idx, (member, started_at) in enumerate(paginated, start=(current_page - 1) * config.ITEMS_PER_LEADERBOARD_PAGE + 1):
            medal = ["🥇", "🥈", "🥉"]
            medal_emoji = medal[idx - 1] if idx <= 3 else f"{idx}."
            embed.add_field(
                name=f"{medal_emoji} {member.name}",
                value=f"**[M]** {member.mention}\nBaşlangıç: <t:{int(started_at.timestamp())}:R>",
                inline=False
            )
        
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="en-iyi", description="Show top officers")
    async def toplist(self, interaction: discord.Interaction, sayfa: int = 1):
        """Show top officers"""
        guild_id = interaction.guild.id
        
        # Get active shifts
        active_shifts = await db.get_active_shifts(guild_id)
        
        if not active_shifts:
            embed = create_info_embed(
                "🏆 En İyi Memurlar",
                "Şu anda aktif memur bulunmamaktadır.",
                footer="Mesai Yönetim Sistemi"
            )
            await interaction.response.send_message(embed=embed)
            return
        
        # Build top list data (top 10)
        toplist_data = []
        for idx, (user_id, started_at) in enumerate(active_shifts[:15], 1):
            member = interaction.guild.get_member(user_id)
            if member:
                toplist_data.append((idx, member, started_at))
        
        # Build embed
        medals = ["🥇", "🥈", "🥉"]
        
        embed = create_embed(
            "🏆 En İyi Aktif Memurlar",
            "Şu anki mesai sıralamasi",
            color=config.PREMIUM_COLOR,
            footer=f"Toplam: {len(toplist_data)} memur • Mesai Yönetim Sistemi"
        )
        
        for idx, member, started_at in toplist_data:
            medal = medals[idx - 1] if idx <= 3 else f"#{idx}"
            embed.add_field(
                name=f"{medal} {member.name}",
                value=f"{member.mention} • <t:{int(started_at.timestamp())}:R>",
                inline=False
            )
        
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(LeaderboardCog(bot))
