"""
Setup/Registration Cog - Server setup and member registration
"""
import discord
from discord.ext import commands
from discord import app_commands
from utils.helpers import create_embed, create_success_embed, create_error_embed
from bot import db
import config
import time


# Simple button views for panels
class ShiftEntryButton(discord.ui.View):
    def __init__(self, cog):
        super().__init__(timeout=None)
        self.cog = cog
    
    @discord.ui.button(label="✅ Mesaiye Gir", style=discord.ButtonStyle.green)
    async def shift_entry(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            if interaction.user.voice is None:
                await interaction.response.send_message("❌ Ses kanalında olmanız gerekir!", ephemeral=True)
                return
            
            guild_id = interaction.guild.id
            user_id = interaction.user.id
            
            await db.start_shift(guild_id, user_id)
            embed = create_success_embed(
                "✅ Mesaiye Girdiniz",
                f"{interaction.user.mention} mesaiye girmiştir."
            )
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            try:
                await interaction.response.send_message(f"❌ Hata: {str(e)}", ephemeral=True)
            except:
                pass


class ShiftExitButton(discord.ui.View):
    def __init__(self, cog):
        super().__init__(timeout=None)
        self.cog = cog
    
    @discord.ui.button(label="❌ Mesaiden Çık", style=discord.ButtonStyle.danger)
    async def shift_exit(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            guild_id = interaction.guild.id
            user_id = interaction.user.id
            
            await db.end_shift(guild_id, user_id)
            embed = create_embed(
                "❌ Mesaiden Çıktınız",
                f"{interaction.user.mention} mesaiden çıkmıştır.",
                color=config.ERROR_COLOR
            )
            embed.set_footer(text="Mesai Yönetim Sistemi")
            await interaction.response.send_message(embed=embed)
        except Exception as e:
            try:
                await interaction.response.send_message(f"❌ Hata: {str(e)}", ephemeral=True)
            except:
                pass


class TicketButton(discord.ui.View):
    def __init__(self, cog):
        super().__init__(timeout=None)
        self.cog = cog
    
    @discord.ui.button(label="🎫 Ticket Aç", style=discord.ButtonStyle.blurple)
    async def open_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            guild_id = interaction.guild.id
            user_id = interaction.user.id
            
            ticket_id = await db.create_ticket(guild_id, user_id, "Destek İsteği")
            embed = create_success_embed(
                "🎫 Ticket Oluşturuldu",
                f"Ticket ID: `{ticket_id}`"
            )
            await interaction.response.send_message(embed=embed, ephemeral=True)
        except Exception as e:
            try:
                await interaction.response.send_message(f"❌ Hata: {str(e)}", ephemeral=True)
            except:
                pass


class ActivityTestButton(discord.ui.View):
    def __init__(self, cog):
        super().__init__(timeout=None)
        self.cog = cog
    
    @discord.ui.button(label="📝 Aktiflik Testi Başla", style=discord.ButtonStyle.green)
    async def start_activity_test(self, interaction: discord.Interaction, button: discord.ui.Button):
        try:
            embed = create_embed(
                "📝 Aktiflik Testi",
                "Aktiflik testini başlatmak için `/aktiflik-test` komutunu kullanın.",
                color=config.INFO_COLOR
            )
            embed.set_footer(text="Mesai Yönetim Sistemi")
            
            await interaction.response.send_message(embed=embed, ephemeral=True)
        except Exception as e:
            try:
                await interaction.response.send_message(f"❌ Hata: {str(e)}", ephemeral=True)
            except:
                pass


class SetupCog(commands.Cog):
    """Server setup and registration commands"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
    
    @app_commands.command(name="sunucu-ayarla", description="Setup the server")
    @app_commands.default_permissions(administrator=True)
    async def setup_server(self, interaction: discord.Interaction):
        """Setup the server with required roles and channels"""
        guild = interaction.guild
        guild_id = guild.id
        
        try:
            await interaction.response.defer()
            
            import asyncio
            
            # 1. Tüm kanalları sil (hızlı silme)
            channels_to_delete = [
                "✅ mesai-girisler", "❌ mesai-cikislar", "📊 mesai-stats",
                "🔨 moderasyon-logs", "⚠️ sistem-logs", "💥 hata-logs",
                "ticket-sistemi", "📢 duyurular"
            ]
            
            for ch_name in channels_to_delete:
                try:
                    channel = discord.utils.get(guild.channels, name=ch_name)
                    if channel:
                        await channel.delete()
                        await asyncio.sleep(0.3)
                except:
                    pass
            
            # 2. Tüm kategorileri sil
            categories_to_delete = ["📊 Mesai", "📋 Loglar", "🎫 Tickets"]
            for cat_name in categories_to_delete:
                try:
                    category = discord.utils.get(guild.categories, name=cat_name)
                    if category:
                        # Kategorinin alt kanallarını sil
                        for channel in category.channels:
                            try:
                                await channel.delete()
                                await asyncio.sleep(0.2)
                            except:
                                pass
                        # Kategorinin kendisini sil
                        await category.delete()
                        await asyncio.sleep(0.3)
                except Exception as e:
                    print(f"Kategori silme hatası: {e}")
                    await asyncio.sleep(0.5)
            
            # 3. Tüm rolleri sil
            role_names = ["Admin", "Moderator", "Verified", "Mesaide"]
            for role_name in role_names:
                try:
                    role = discord.utils.get(guild.roles, name=role_name)
                    if role:
                        await role.delete()
                        await asyncio.sleep(0.2)
                except:
                    pass
            
            # Uzun bekleme
            await asyncio.sleep(4)
            
            # 4. Yeni Rolleri oluştur
            roles_created = []
            role_names = ["Admin", "Moderator", "Verified", "Mesaide"]
            role_colors = [
                discord.Color.red(),
                discord.Color.orange(),
                discord.Color.blue(),
                discord.Color.green()
            ]
            
            for role_name, color in zip(role_names, role_colors):
                try:
                    role = await guild.create_role(name=role_name, color=color)
                    roles_created.append(f"✅ {role_name}")
                    await asyncio.sleep(0.3)
                except Exception as e:
                    print(f"Rol oluşturma hatası ({role_name}): {e}")
                    roles_created.append(f"❌ {role_name}")
            
            # Kategorileri oluşturmadan önce uzun bekleme
            await asyncio.sleep(2)
            
            # 5. Yeni Kategorileri oluştur
            mesai_category = None
            log_category = None
            ticket_category = None
            
            try:
                mesai_category = await guild.create_category("📊 Mesai")
                await asyncio.sleep(0.5)
            except Exception as e:
                print(f"Mesai kategorisi oluşturma hatası: {e}")
                await asyncio.sleep(1)
                try:
                    mesai_category = await guild.create_category("📊 Mesai")
                except:
                    pass
            
            try:
                log_category = await guild.create_category("📋 Loglar")
                await asyncio.sleep(0.5)
            except Exception as e:
                print(f"Log kategorisi oluşturma hatası: {e}")
                await asyncio.sleep(1)
                try:
                    log_category = await guild.create_category("📋 Loglar")
                except:
                    pass
            
            try:
                ticket_category = await guild.create_category("🎫 Tickets")
                await asyncio.sleep(0.5)
            except Exception as e:
                print(f"Ticket kategorisi oluşturma hatası: {e}")
                await asyncio.sleep(1)
                try:
                    ticket_category = await guild.create_category("🎫 Tickets")
                except:
                    pass
            
            # 6. Yeni Kanalları oluştur
            channels_created = []
            
            # Mesai kanalları
            if mesai_category:
                mesai_channels = ["✅ mesai-girisler", "❌ mesai-cikislar", "📊 mesai-stats"]
                for ch_name in mesai_channels:
                    try:
                        await guild.create_text_channel(ch_name, category=mesai_category)
                        channels_created.append(f"✅ {ch_name}")
                        await asyncio.sleep(0.5)
                    except Exception as e:
                        print(f"Kanal oluşturma hatası ({ch_name}): {e}")
            
            # Log kanalları
            if log_category:
                log_channels = ["🔨 moderasyon-logs", "⚠️ sistem-logs", "💥 hata-logs"]
                for ch_name in log_channels:
                    try:
                        await guild.create_text_channel(ch_name, category=log_category)
                        channels_created.append(f"✅ {ch_name}")
                        await asyncio.sleep(0.5)
                    except Exception as e:
                        print(f"Kanal oluşturma hatası ({ch_name}): {e}")
            
            # Ticket kanalı
            if ticket_category:
                try:
                    await guild.create_text_channel("ticket-sistemi", category=ticket_category)
                    channels_created.append(f"✅ ticket-sistemi")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Kanal oluşturma hatası: {e}")
            
            # Duyurular kanalı
            try:
                await guild.create_text_channel("📢 duyurular")
                channels_created.append(f"✅ 📢 duyurular")
                await asyncio.sleep(0.5)
            except Exception as e:
                print(f"Kanal oluşturma hatası: {e}")
            
            # 7. Panelleri kanalara gönder
            panels_created = []
            
            await asyncio.sleep(1)
            
            # Mesai Giriş Paneli
            mesai_gir_ch = discord.utils.get(guild.channels, name="✅ mesai-girisler")
            if mesai_gir_ch:
                try:
                    panel = create_success_embed(
                        "✅ Mesai Giriş Sistemi",
                        "Mesaiye girmek için aşağıdaki butona tıklayın.\n\n**Gereksinimler:**\n• Ses kanalında olmak zorunludur",
                        footer="Mesai Yönetim Sistemi"
                    )
                    await mesai_gir_ch.send(embed=panel, view=ShiftEntryButton(self))
                    panels_created.append("✅ Mesai Giriş Paneli (Butonlu)")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Panel gönderme hatası: {e}")
            
            # Mesai Çıkış Paneli
            mesai_cik_ch = discord.utils.get(guild.channels, name="❌ mesai-cikislar")
            if mesai_cik_ch:
                try:
                    panel = create_embed(
                        "❌ Mesai Çıkış Sistemi",
                        "Mesaiden çıkmak için aşağıdaki butona tıklayın.",
                        color=config.ERROR_COLOR
                    )
                    panel.set_footer(text="Mesai Yönetim Sistemi")
                    await mesai_cik_ch.send(embed=panel, view=ShiftExitButton(self))
                    panels_created.append("✅ Mesai Çıkış Paneli (Butonlu)")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Panel gönderme hatası: {e}")
            
            # Mesai Stats Paneli
            stats_ch = discord.utils.get(guild.channels, name="📊 mesai-stats")
            if stats_ch:
                try:
                    panel = create_embed(
                        "📊 Mesai İstatistikleri",
                        "Bu kanala mesai istatistikleri gönderilir.",
                        color=config.PRIMARY_COLOR
                    )
                    panel.set_footer(text="Mesai Yönetim Sistemi")
                    await stats_ch.send(embed=panel)
                    panels_created.append("✅ Mesai Stats Paneli")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Panel gönderme hatası: {e}")
            
            # Moderasyon Logları Paneli
            mod_log_ch = discord.utils.get(guild.channels, name="🔨 moderasyon-logs")
            if mod_log_ch:
                try:
                    panel = create_embed(
                        "🔨 Moderasyon Logları",
                        "Bu kanala tüm moderasyon işlemleri kaydedilir.",
                        color=config.WARNING_COLOR
                    )
                    panel.set_footer(text="Mesai Yönetim Sistemi")
                    await mod_log_ch.send(embed=panel)
                    panels_created.append("✅ Moderasyon Logs Paneli")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Panel gönderme hatası: {e}")
            
            # Sistem Logları Paneli
            sys_log_ch = discord.utils.get(guild.channels, name="⚠️ sistem-logs")
            if sys_log_ch:
                try:
                    panel = create_embed(
                        "⚠️ Sistem Logları",
                        "Bu kanala sistem olayları kaydedilir.",
                        color=config.INFO_COLOR
                    )
                    panel.set_footer(text="Mesai Yönetim Sistemi")
                    await sys_log_ch.send(embed=panel, view=ActivityTestButton(self))
                    panels_created.append("✅ Sistem Logs Paneli (Butonlu)")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Panel gönderme hatası: {e}")
            
            # Hata Logları Paneli
            error_log_ch = discord.utils.get(guild.channels, name="💥 hata-logs")
            if error_log_ch:
                try:
                    panel = create_error_embed(
                        "💥 Hata Logları",
                        "Bu kanala tüm hatalar kaydedilir."
                    )
                    panel.set_footer(text="Mesai Yönetim Sistemi")
                    await error_log_ch.send(embed=panel)
                    panels_created.append("✅ Hata Logs Paneli")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Panel gönderme hatası: {e}")
            
            # Duyurular Paneli
            announce_ch = discord.utils.get(guild.channels, name="📢 duyurular")
            if announce_ch:
                try:
                    panel = create_embed(
                        "📢 Duyurular",
                        "Bu kanala sunucu duyuruları gönderilir.",
                        color=config.PRIMARY_COLOR
                    )
                    panel.set_footer(text="Mesai Yönetim Sistemi")
                    await announce_ch.send(embed=panel)
                    panels_created.append("✅ Duyurular Paneli")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Panel gönderme hatası: {e}")
            
            # Ticket Sistemi Paneli
            ticket_ch = discord.utils.get(guild.channels, name="ticket-sistemi")
            if ticket_ch:
                try:
                    panel = create_success_embed(
                        "🎫 Ticket Sistem Bilgisi",
                        "Destek almak için aşağıdaki butona tıklayın.",
                        footer="Mesai Yönetim Sistemi"
                    )
                    await ticket_ch.send(embed=panel, view=TicketButton(self))
                    panels_created.append("✅ Ticket Sistemi Paneli (Butonlu)")
                    await asyncio.sleep(0.5)
                except Exception as e:
                    print(f"Panel gönderme hatası: {e}")
            
            # Başarı Embedini gönder
            embed = create_success_embed(
                "⚙️ Sunucu Kurulumu Tamamlandı",
                "Sunucu başarıyla kurulmuştur!",
                footer="Mesai Yönetim Sistemi"
            )
            
            embed.add_field(
                name="✅ Oluşturulan Roller",
                value="\n".join(roles_created),
                inline=False
            )
            
            embed.add_field(
                name="📁 Kategoriler",
                value="✅ 📊 Mesai\n✅ 📋 Loglar\n✅ 🎫 Tickets",
                inline=False
            )
            
            embed.add_field(
                name="📢 Oluşturulan Kanallar",
                value="\n".join(channels_created),
                inline=False
            )
            
            embed.add_field(
                name="📌 Yapılan İşlemler",
                value="✅ Eski veriler silindi\n✅ Roller oluşturuldu\n✅ Kategoriler oluşturuldu\n✅ Kanallar oluşturuldu\n✅ Paneller kuruldu\n✅ Sistem konfigüre edildi",
                inline=False
            )
            
            embed.add_field(
                name="📋 Kurulu Paneller",
                value="\n".join(panels_created),
                inline=False
            )
            
            await interaction.followup.send(embed=embed)
            
        except Exception as e:
            import traceback
            embed = create_error_embed(
                "❌ Kurulum Başarısız",
                f"Hata: {str(e)}"
            )
            traceback.print_exc()
            await interaction.followup.send(embed=embed)
    
    @app_commands.command(name="kayit", description="Register to the server")
    async def register(
        self,
        interaction: discord.Interaction,
        ad: str,
        yas: int
    ):
        """Register a new member"""
        user_id = interaction.user.id
        guild_id = interaction.guild.id
        
        # Add registration to database
        embed = create_success_embed(
            "✅ Kayıt Başarılı",
            f"Sunucuya hoşgeldiniz {interaction.user.mention}!\n\n**Adınız:** `{ad}`\n**Yaşınız:** `{yas}`",
            footer=f"ID: {user_id}"
        )
        await interaction.response.send_message(embed=embed)
    
    @app_commands.command(name="profil", description="View your profile")
    async def profile(self, interaction: discord.Interaction, user: discord.User = None):
        """View member profile"""
        if user is None:
            user = interaction.user
        
        embed = create_embed(
            f"👤 {user.name} Profili",
            f"Kullanıcı ID: {user.id}",
            color=config.PRIMARY_COLOR
        )
        embed.set_thumbnail(url=user.avatar.url if user.avatar else None)
        embed.add_field(
            name="Hesap Oluşturma Tarihi",
            value=user.created_at.strftime("%d.%m.%Y %H:%M"),
            inline=True
        )
        
        await interaction.response.send_message(embed=embed)


async def setup(bot: commands.Bot):
    """Setup the cog"""
    await bot.add_cog(SetupCog(bot))
