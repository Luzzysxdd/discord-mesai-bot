/**
 * ═══════════════════════════════════════════════════════════════
 * 🤖 EVENT: READY
 * ═══════════════════════════════════════════════════════════════
 */

import logger from "../utils/logger.js";

export default {
  name: "ready",
  once: true,

  async execute(bot) {
    logger.success(
      `✅ Bot is ready! Logged in as ${bot.user.tag}`
    );
  },
};
