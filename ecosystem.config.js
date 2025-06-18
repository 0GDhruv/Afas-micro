module.exports = {
  apps: [
    {
      name: "frontend-service",
      script: "app.js",
      cwd: "./frontend-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    },
    {
      name: "upload-service",
      script: "app.js",
      cwd: "./upload-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    },
    {
      name: "audio-processing-service",
      script: "app.js",
      cwd: "./audio-processing-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    },
    {
      name: "fids-integration-service",
      script: "app.js",
      cwd: "./fids-integration-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    },
    {
      name: "scheduler-service",
      script: "app.js",
      cwd: "./scheduler-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    },
    {
      name: "scriptmanager-service",
      script: "app.js",
      cwd: "./scriptmanager-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    },
    {
      name: "settings-service",
      script: "app.js",
      cwd: "./settings-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    },
    {
      name: "zone-service",
      script: "app.js",
      cwd: "./zone-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    },
    {
      name: "playlist-service",
      script: "app.js",
      cwd: "./playlist-service",
      watch: false,
      interpreter: "node",
      autorestart: true
    }
  ]
};
