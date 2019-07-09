const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (env, argv) => {
  let serverPath = './src/server/server.';
  serverPath += (argv.mode === 'production') ? 'prod.js' : 'dev.js';

  return ({
    entry: {
      server: serverPath,
    },
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath: '/',
      filename: '[name].js',
    },
    mode: argv.mode,
    target: 'node',
    node: {
      __dirname: false,
      __filename: false,
    },
    externals: [nodeExternals()],
  });
};
