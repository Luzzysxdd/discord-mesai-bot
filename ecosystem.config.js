/**
 * ═══════════════════════════════════════════════════════════════
 * 🚀 PM2 ECOSYSTEM CONFIGURATION - VDS PRODUCTION SETUP
 * ═══════════════════════════════════════════════════════════════
 * Run: pm2 start ecosystem.config.js
 */

export default {
  apps: [
    {
      // App metadata
      name: "mesai-bot",
      script: "./bot.js",
      namespace: "luzzysxdd",
      
      // Execution
      interpreter: "node",
      node_args: "--max-old-space-size=2048",
      
      // Auto restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Logging
      output: "./logs/pm2-out.log",
      error: "./logs/pm2-err.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      
      // Environment
      env: {
        NODE_ENV: "development",
        DEBUG: "false",
      },
      
      env_production: {
        NODE_ENV: "production",
        DEBUG: "false",
      },
      
      // Monitoring
      max_memory_restart: "500M",
      
      // Advanced
      instances: 1,
      exec_mode: "fork",
      cron_restart: "0 0 * * *", // Daily restart at midnight
      
      // Merge logs from multiple processes
      merge_logs: true,
      
      // Ignore certain signals
      ignore_watch: [
        "node_modules",
        "data",
        "logs",
        ".git",
      ],
      
      // Watch for file changes (development)
      watch: ["bot.js", "config.js", "commands", "events", "utils"],
      watch_delay: 2000,
      watch_ignore: ["data", "logs"],
    },
  ],

  // Global settings
  monitor_interval: 5000,
};
