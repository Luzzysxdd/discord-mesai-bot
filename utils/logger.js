/**
 * ═══════════════════════════════════════════════════════════════
 * 📝 LOGGER UTILITY - ADVANCED LOGGING SYSTEM
 * ═══════════════════════════════════════════════════════════════
 */

import config from "../config.js";
import moment from "moment-timezone";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDir = path.join(__dirname, "..", "logs");

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Color constants for console
 */
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  // Foreground colors
  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  },

  // Background colors
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
  },
};

/**
 * Get current timestamp
 */
function getTimestamp() {
  return moment()
    .tz(config.time.timezone)
    .format("DD.MM.YYYY HH:mm:ss");
}

/**
 * Get current date for log file
 */
function getLogDate() {
  return moment()
    .tz(config.time.timezone)
    .format("DD-MM-YYYY");
}

/**
 * Logger class
 */
export class Logger {
  constructor(label = "BOT") {
    this.label = label;
    this.logFile = path.join(logsDir, `bot-${getLogDate()}.log`);
  }

  /**
   * Write to log file
   */
  writeToFile(level, message) {
    const timestamp = getTimestamp();
    const logMessage = `[${timestamp}] [${level}] [${this.label}] ${message}\n`;

    fs.appendFileSync(this.logFile, logMessage, "utf-8");
  }

  /**
   * Info log
   */
  info(message) {
    const timestamp = getTimestamp();
    console.log(
      `${colors.fg.cyan}[${timestamp}]${colors.reset} ${colors.fg.cyan}[INFO]${colors.reset} ${colors.fg.blue}[${this.label}]${colors.reset} ${message}`
    );
    this.writeToFile("INFO", message);
  }

  /**
   * Success log
   */
  success(message) {
    const timestamp = getTimestamp();
    console.log(
      `${colors.fg.cyan}[${timestamp}]${colors.reset} ${colors.fg.green}[SUCCESS]${colors.reset} ${colors.fg.blue}[${this.label}]${colors.reset} ${message}`
    );
    this.writeToFile("SUCCESS", message);
  }

  /**
   * Warning log
   */
  warn(message) {
    const timestamp = getTimestamp();
    console.log(
      `${colors.fg.cyan}[${timestamp}]${colors.reset} ${colors.fg.yellow}[WARN]${colors.reset} ${colors.fg.blue}[${this.label}]${colors.reset} ${message}`
    );
    this.writeToFile("WARN", message);
  }

  /**
   * Error log
   */
  error(message, error = null) {
    const timestamp = getTimestamp();
    console.error(
      `${colors.fg.cyan}[${timestamp}]${colors.reset} ${colors.fg.red}[ERROR]${colors.reset} ${colors.fg.blue}[${this.label}]${colors.reset} ${message}`
    );

    if (error) {
      console.error(`${colors.fg.red}${error.stack}${colors.reset}`);
      this.writeToFile("ERROR", `${message}\n${error.stack}`);
    } else {
      this.writeToFile("ERROR", message);
    }
  }

  /**
   * Debug log
   */
  debug(message) {
    if (process.env.DEBUG === "true") {
      const timestamp = getTimestamp();
      console.log(
        `${colors.fg.cyan}[${timestamp}]${colors.reset} ${colors.fg.magenta}[DEBUG]${colors.reset} ${colors.fg.blue}[${this.label}]${colors.reset} ${message}`
      );
      this.writeToFile("DEBUG", message);
    }
  }

  /**
   * Table log (for arrays/objects)
   */
  table(title, data) {
    console.log(
      `${colors.fg.yellow}${colors.bright}${title}${colors.reset}`
    );
    console.table(data);
    this.writeToFile("TABLE", `${title}\n${JSON.stringify(data, null, 2)}`);
  }
}

export default new Logger("MAIN");
