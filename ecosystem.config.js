module.exports = {
  apps: [
    {
      name: 'app',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster'
    }
  ]
};
