// PM2 Ecosystem File
export default ()=> {
  apps: [{
    name: "uber-clone-backend",
    script: "server.js",
    instances: "max",
    exec_mode: "cluster",
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env_production: {
      NODE_ENV: "production",
      PORT: 5000
    },
    env_development: {
      NODE_ENV: "development",
      PORT: 5000
    }
  }]
}