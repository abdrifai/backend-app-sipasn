module.exports = {
    apps: [
        {
            name: "backend-sipasn",
            script: "./server.js",
            cwd: "/var/www/backend-app-sipasn",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",

            // Sisakan hanya mode environment PM2
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};