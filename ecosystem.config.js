module.exports = {
  apps: [{
    name: 'rapid-saas-ai-store',
    script: "server.js",
    exec_mode: "fork",
    instances: 1,
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    env_production: {
      NODE_ENV: "production",
      PORT: 3000
    },
    // PM2 options
    watch: false,
    max_memory_restart: "1G",
    error_file: "./logs/err.log",
    out_file: "./logs/out.log",
    log_file: "./logs/combined.log",
    time: true,
    // Auto restart on crash
    autorestart: true,
    max_restarts: 10,
    min_uptime: "10s"
  }]
};