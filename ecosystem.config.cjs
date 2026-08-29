module.exports = {
  apps: [
    {
      name: 'iran-behtar',
      script: '.next/standalone/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
      // Restart policy
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '1G',
      // Logging
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Watch (optional, disable in production)
      watch: false,
    },
  ],
};
