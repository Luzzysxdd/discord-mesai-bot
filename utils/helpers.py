"""
Utility helper functions
"""
from datetime import datetime
import discord
import config


def format_duration(seconds: int) -> str:
    """Format seconds into readable duration string"""
    hours, remainder = divmod(seconds, 3600)
    minutes, _ = divmod(remainder, 60)
    
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"


def get_timestamp() -> str:
    """Get current timestamp as string"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def create_embed(
    title: str,
    description: str = "",
    color: int = None,
    footer: str = None,
    **kwargs
) -> discord.Embed:
    """Create a modern styled embed with developer credits"""
    if color is None:
        color = config.EMBED_COLOR
    
    embed = discord.Embed(
        title=title,
        description=description,
        color=color,
        timestamp=datetime.now()
    )
    
    # Add fields
    for name, value in kwargs.items():
        embed.add_field(name=name, value=value, inline=False)
    
    # Add footer with credits
    footer_text = config.DEVELOPER_CREDITS
    if footer:
        footer_text = f"{footer} • {footer_text}"
    
    embed.set_footer(text=footer_text)
    
    return embed


def create_success_embed(title: str, description: str = "", **kwargs) -> discord.Embed:
    """Create a success styled embed"""
    return create_embed(title, description, color=config.SUCCESS_COLOR, **kwargs)


def create_error_embed(title: str, description: str = "", **kwargs) -> discord.Embed:
    """Create an error styled embed"""
    return create_embed(title, description, color=config.ERROR_COLOR, **kwargs)


def create_warning_embed(title: str, description: str = "", **kwargs) -> discord.Embed:
    """Create a warning styled embed"""
    return create_embed(title, description, color=config.WARNING_COLOR, **kwargs)


def create_info_embed(title: str, description: str = "", **kwargs) -> discord.Embed:
    """Create an info styled embed"""
    return create_embed(title, description, color=config.INFO_COLOR, **kwargs)


async def paginate_list(items: list, page: int = 1, items_per_page: int = 10) -> tuple:
    """Paginate a list and return current page items and total pages"""
    total_pages = (len(items) + items_per_page - 1) // items_per_page
    
    if page < 1:
        page = 1
    elif page > total_pages:
        page = total_pages
    
    start_idx = (page - 1) * items_per_page
    end_idx = start_idx + items_per_page
    
    return items[start_idx:end_idx], page, total_pages
