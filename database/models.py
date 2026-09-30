"""
Database models for Mesai Bot
"""
import aiosqlite
import sqlite3
from datetime import datetime


class Database:
    """Database handler for Mesai Bot"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.db: aiosqlite.Connection = None
    
    async def initialize(self):
        """Initialize database and create tables"""
        # Create data directory if it doesn't exist
        import os
        os.makedirs(os.path.dirname(self.db_path) or ".", exist_ok=True)
        
        self.db = await aiosqlite.connect(self.db_path)
        await self.create_tables()
    
    async def create_tables(self):
        """Create all necessary database tables"""
        
        # Shifts table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS shifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                duration INTEGER,
                active BOOLEAN DEFAULT 1,
                UNIQUE(guild_id, user_id)
            )
        """)
        
        # Excuses table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS excuses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                excuse_date DATE NOT NULL,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                approved_by INTEGER,
                approved_at TIMESTAMP
            )
        """)
        
        # Units table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS units (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                unit_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(guild_id, name)
            )
        """)
        
        # Unit assignments table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS unit_assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                unit_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at TIMESTAMP,
                active BOOLEAN DEFAULT 1,
                FOREIGN KEY(unit_id) REFERENCES units(id)
            )
        """)
        
        # Tickets table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                closed_at TIMESTAMP,
                assigned_to INTEGER
            )
        """)
        
        # Penalties table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS penalties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                points INTEGER NOT NULL,
                reason TEXT,
                given_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Events table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                event_date DATE,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                cancelled BOOLEAN DEFAULT 0
            )
        """)
        
        # Event participants table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS event_participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(event_id) REFERENCES events(id)
            )
        """)
        
        # Warnings table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS warnings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                reason TEXT,
                warned_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Guild settings table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id INTEGER PRIMARY KEY,
                shift_enabled BOOLEAN DEFAULT 1,
                voice_required BOOLEAN DEFAULT 1,
                game_check_enabled BOOLEAN DEFAULT 0,
                inactivity_threshold INTEGER DEFAULT 2,
                exempt_roles TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Activity log table
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS activity_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                activity_type TEXT,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        await self.db.commit()
    
    async def close(self):
        """Close database connection"""
        if self.db:
            await self.db.close()
    
    # Shift operations
    async def start_shift(self, guild_id: int, user_id: int) -> bool:
        """Start a shift for a user"""
        try:
            await self.db.execute("""
                INSERT OR REPLACE INTO shifts (guild_id, user_id, started_at, active)
                VALUES (?, ?, CURRENT_TIMESTAMP, 1)
            """, (guild_id, user_id))
            await self.db.commit()
            return True
        except Exception as e:
            print(f"Error starting shift: {e}")
            return False
    
    async def end_shift(self, guild_id: int, user_id: int) -> bool:
        """End a shift for a user"""
        try:
            await self.db.execute("""
                UPDATE shifts 
                SET ended_at = CURRENT_TIMESTAMP, active = 0
                WHERE guild_id = ? AND user_id = ? AND active = 1
            """, (guild_id, user_id))
            await self.db.commit()
            return True
        except Exception as e:
            print(f"Error ending shift: {e}")
            return False
    
    async def get_active_shifts(self, guild_id: int) -> list:
        """Get all active shifts in a guild"""
        cursor = await self.db.execute("""
            SELECT user_id, started_at FROM shifts
            WHERE guild_id = ? AND active = 1
            ORDER BY started_at DESC
        """, (guild_id,))
        return await cursor.fetchall()
    
    async def is_user_on_shift(self, guild_id: int, user_id: int) -> bool:
        """Check if user is currently on shift"""
        cursor = await self.db.execute("""
            SELECT id FROM shifts
            WHERE guild_id = ? AND user_id = ? AND active = 1
        """, (guild_id, user_id))
        result = await cursor.fetchone()
        return result is not None
    
    # Excuse operations
    async def submit_excuse(self, guild_id: int, user_id: int, reason: str, date: str) -> bool:
        """Submit an excuse"""
        try:
            await self.db.execute("""
                INSERT INTO excuses (guild_id, user_id, reason, excuse_date, status)
                VALUES (?, ?, ?, ?, 'pending')
            """, (guild_id, user_id, reason, date))
            await self.db.commit()
            return True
        except Exception as e:
            print(f"Error submitting excuse: {e}")
            return False
    
    async def get_excuses(self, guild_id: int, status: str = None) -> list:
        """Get excuses for a guild"""
        if status:
            cursor = await self.db.execute("""
                SELECT * FROM excuses
                WHERE guild_id = ? AND status = ?
                ORDER BY created_at DESC
            """, (guild_id, status))
        else:
            cursor = await self.db.execute("""
                SELECT * FROM excuses
                WHERE guild_id = ?
                ORDER BY created_at DESC
            """, (guild_id,))
        return await cursor.fetchall()
    
    async def update_excuse_status(self, excuse_id: int, status: str, approved_by: int = None) -> bool:
        """Update excuse status"""
        try:
            await self.db.execute("""
                UPDATE excuses
                SET status = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (status, approved_by, excuse_id))
            await self.db.commit()
            return True
        except Exception as e:
            print(f"Error updating excuse: {e}")
            return False
    
    # Ticket operations
    async def create_ticket(self, guild_id: int, user_id: int, title: str, description: str = None) -> int:
        """Create a support ticket"""
        try:
            cursor = await self.db.execute("""
                INSERT INTO tickets (guild_id, user_id, title, description, status)
                VALUES (?, ?, ?, ?, 'open')
            """, (guild_id, user_id, title, description))
            await self.db.commit()
            return cursor.lastrowid
        except Exception as e:
            print(f"Error creating ticket: {e}")
            return None
