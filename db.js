/**
 * ═══════════════════════════════════════════════════════════════
 * 📊 DATABASE INITIALIZATION & MANAGEMENT
 * ═══════════════════════════════════════════════════════════════
 * Simple JSON-based database (lightweight & reliable)
 */

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const dataDir = join(__dirname, "data");
const dbFilePath = join(dataDir, "database.json");

// Ensure data directory exists
try {
  mkdirSync(dataDir, { recursive: true });
} catch (e) {
  // Directory already exists
}

// In-memory database object
let database = {};

// Load database from file or create new
function loadDatabase() {
  try {
    if (existsSync(dbFilePath)) {
      const data = readFileSync(dbFilePath, "utf-8");
      database = JSON.parse(data);
    } else {
      database = {};
      saveDatabase();
    }
  } catch (error) {
    console.warn("Could not load database, starting fresh:", error.message);
    database = {};
  }
}

// Save database to file
function saveDatabase() {
  try {
    writeFileSync(dbFilePath, JSON.stringify(database, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save database:", error);
  }
}

// Database API (simple key-value store)
export const db = {
  get(key) {
    return database[key];
  },

  set(key, value) {
    database[key] = value;
    saveDatabase();
    return value;
  },

  delete(key) {
    delete database[key];
    saveDatabase();
  },

  all() {
    return Object.entries(database).map(([ID, value]) => ({
      ID,
      value,
    }));
  },

  clear() {
    database = {};
    saveDatabase();
  },
};

/**
 * Initialize all database tables and collections
 */
export async function initializeDatabase() {
  console.log("📊 Database Initializing...");

  // Load database from file first
  loadDatabase();

  // ═══ MESAI/SHIFT DATA ═══
  db.set("mesai", db.get("mesai") || {});
  db.set("mesai_history", db.get("mesai_history") || []);

  // ═══ LEADERBOARD DATA ═══
  db.set("leaderboard", db.get("leaderboard") || {});
  db.set("user_stats", db.get("user_stats") || {});

  // ═══ EXCUSES/MAZERETLER ═══
  db.set("excuses", db.get("excuses") || {});

  // ═══ UNITS & PATROLS ═══
  db.set("units", db.get("units") || {});
  db.set("patrols", db.get("patrols") || {});

  // ═══ TICKETS ═══
  db.set("tickets", db.get("tickets") || {});

  // ═══ PENALTIES & WARNINGS ═══
  db.set("penalties", db.get("penalties") || {});
  db.set("warnings", db.get("warnings") || {});

  // ═══ GUILD SETTINGS ═══
  db.set("guild_settings", db.get("guild_settings") || {});

  // ═══ LOGGING ═══
  db.set("logs", db.get("logs") || []);

  console.log("✅ Database Initialized Successfully!");
}

/**
 * MESAI SYSTEM FUNCTIONS
 */

export const mesaiDB = {
  /**
   * Mesaia gir (Kullanıcı ses kanalında mesai başlat)
   */
  startShift(userId, guildId) {
    const key = `mesai_${guildId}_${userId}`;
    const startTime = Date.now();

    db.set(key, {
      userId,
      guildId,
      startTime,
      isActive: true,
    });

    // History'ye ekle
    const history = db.get("mesai_history") || [];
    history.push({
      userId,
      guildId,
      startTime,
      endTime: null,
      duration: 0,
      type: "shift_start",
    });
    db.set("mesai_history", history);

    return startTime;
  },

  /**
   * Mesaidan çık
   */
  endShift(userId, guildId) {
    const key = `mesai_${guildId}_${userId}`;
    const shiftData = db.get(key);

    if (!shiftData) return null;

    const endTime = Date.now();
    const duration = endTime - shiftData.startTime;

    // Update history
    const history = db.get("mesai_history") || [];
    const lastEntry = history.find(
      (h) =>
        h.userId === userId &&
        h.guildId === guildId &&
        h.endTime === null
    );

    if (lastEntry) {
      lastEntry.endTime = endTime;
      lastEntry.duration = duration;
    }

    db.set("mesai_history", history);

    // Update user stats
    const userStats = db.get(`user_stats_${guildId}_${userId}`) || {
      totalShiftTime: 0,
      shiftsCompleted: 0,
      lastShiftTime: 0,
    };

    userStats.totalShiftTime += duration;
    userStats.shiftsCompleted += 1;
    userStats.lastShiftTime = endTime;

    db.set(`user_stats_${guildId}_${userId}`, userStats);

    // Remove from active mesai
    db.delete(key);

    return { duration, endTime };
  },

  /**
   * Aktif mesaideki kullanıcıları getir
   */
  getActiveUsers(guildId) {
    const activeUsers = [];
    const data = db.all();

    data.forEach((item) => {
      if (
        item.ID.startsWith(`mesai_${guildId}_`) &&
        item.value.isActive
      ) {
        activeUsers.push(item.value);
      }
    });

    return activeUsers;
  },

  /**
   * Kullanıcının toplam mesai süresini getir
   */
  getUserTotalTime(userId, guildId) {
    const stats = db.get(`user_stats_${guildId}_${userId}`) || {
      totalShiftTime: 0,
      shiftsCompleted: 0,
    };

    return stats.totalShiftTime;
  },

  /**
   * Kullanıcının mesai durumunu kontrol et
   */
  isUserInShift(userId, guildId) {
    const key = `mesai_${guildId}_${userId}`;
    const shift = db.get(key);
    return shift && shift.isActive;
  },
};

/**
 * LEADERBOARD FUNCTIONS
 */

export const leaderboardDB = {
  /**
   * Leaderboard'u getir (Pagination destekli)
   */
  getLeaderboard(guildId, page = 1, pageSize = 10) {
    const data = db.all();
    const stats = [];

    data.forEach((item) => {
      if (
        item.ID.startsWith(`user_stats_${guildId}_`) &&
        item.value.totalShiftTime > 0
      ) {
        const userId = item.ID.replace(
          `user_stats_${guildId}_`,
          ""
        );
        stats.push({
          userId,
          ...item.value,
        });
      }
    });

    // Sıra
    stats.sort(
      (a, b) => b.totalShiftTime - a.totalShiftTime
    );

    // Pagination
    const totalPages = Math.ceil(stats.length / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedStats = stats.slice(
      startIdx,
      endIdx
    );

    return {
      data: paginatedStats,
      page,
      totalPages,
      totalUsers: stats.length,
    };
  },

  /**
   * Top 10 kullanıcıyı getir
   */
  getTop10(guildId) {
    return this.getLeaderboard(guildId, 1, 10);
  },
};

/**
 * EXCUSE FUNCTIONS
 */

export const excuseDB = {
  /**
   * Yeni mazeret ekle
   */
  addExcuse(userId, guildId, reason, attachment = null) {
    const excuseId = `excuse_${Date.now()}`;

    db.set(excuseId, {
      id: excuseId,
      userId,
      guildId,
      reason,
      attachment,
      status: "pending",
      createdAt: Date.now(),
      reviewedAt: null,
      reviewedBy: null,
      decision: null,
    });

    return excuseId;
  },

  /**
   * Mazereti getir
   */
  getExcuse(excuseId) {
    return db.get(excuseId);
  },

  /**
   * Mazereti onayla/reddet
   */
  reviewExcuse(excuseId, decision, reviewedBy) {
    const excuse = db.get(excuseId);

    if (!excuse) return null;

    excuse.status = (decision === "approve" || decision === "approved") ? "approved" : "rejected";
    excuse.decision = decision;
    excuse.reviewedAt = Date.now();
    excuse.reviewedBy = reviewedBy;

    db.set(excuseId, excuse);

    return excuse;
  },

  /**
   * Kullanıcının mazeretlerini getir
   */
  getUserExcuses(userId, guildId) {
    const data = db.all();
    const excuses = [];

    data.forEach((item) => {
      if (
        item.ID.startsWith("excuse_") &&
        item.value.userId === userId &&
        item.value.guildId === guildId
      ) {
        excuses.push(item.value);
      }
    });

    return excuses;
  },
};

/**
 * UNIT FUNCTIONS
 */

export const unitDB = {
  /**
   * Yeni birim oluştur
   */
  createUnit(guildId, name, type = "patrol") {
    const unitId = `unit_${Date.now()}`;

    db.set(unitId, {
      id: unitId,
      guildId,
      name,
      type,
      leader: null,
      members: [],
      patrols: [],
      notes: "",
      createdAt: Date.now(),
    });

    return unitId;
  },

  /**
   * Birime üye ekle
   */
  addMemberToUnit(unitId, userId) {
    const unit = db.get(unitId);

    if (!unit) return null;

    if (!unit.members.includes(userId)) {
      unit.members.push(userId);
      db.set(unitId, unit);
    }

    return unit;
  },

  /**
   * Birim notlarını güncelle
   */
  updateUnitNotes(unitId, notes) {
    const unit = db.get(unitId);

    if (!unit) return null;

    unit.notes = notes;
    db.set(unitId, unit);

    return unit;
  },

  /**
   * Guild'in tüm birimlerini getir
   */
  getGuildUnits(guildId) {
    const data = db.all();
    const units = [];

    data.forEach((item) => {
      if (
        item.ID.startsWith("unit_") &&
        item.value.guildId === guildId
      ) {
        units.push(item.value);
      }
    });

    return units;
  },
};

/**
 * PENALTY FUNCTIONS
 */

export const penaltyDB = {
  /**
   * Ceza ver
   */
  addPenalty(userId, guildId, points, reason, issuedBy) {
    const penaltyId = `penalty_${Date.now()}`;

    db.set(penaltyId, {
      id: penaltyId,
      userId,
      guildId,
      points,
      reason,
      issuedBy,
      createdAt: Date.now(),
    });

    // User toplam puan
    const userKey = `user_penalties_${guildId}_${userId}`;
    const totalPoints = (db.get(userKey) || 0) + points;
    db.set(userKey, totalPoints);

    return penaltyId;
  },

  /**
   * Kullanıcının toplam ceza puanını getir
   */
  getUserPenaltyPoints(userId, guildId) {
    return db.get(
      `user_penalties_${guildId}_${userId}`
    ) || 0;
  },
};

/**
 * LOGGING FUNCTIONS
 */

export const logsDB = {
  /**
   * Log ekle
   */
  addLog(guildId, category, message, metadata = {}) {
    const logs = db.get("logs") || [];

    logs.push({
      timestamp: Date.now(),
      guildId,
      category,
      message,
      metadata,
    });

    // Son 1000 logu tut
    if (logs.length > 1000) {
      logs.shift();
    }

    db.set("logs", logs);

    return logs.length;
  },

  /**
   * Guild loğunu getir
   */
  getGuildLogs(guildId, limit = 50) {
    const logs = db.get("logs") || [];
    return logs
      .filter((l) => l.guildId === guildId)
      .slice(-limit)
      .reverse();
  },
};

export default db;
