const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (env, argv) => {
  let serverPath = './src/server/server.';
  serverPath += (argv.mode === 'production') ? 'prod.ts' : 'dev.ts';

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
    module: {
      rules: [
        {
          enforce: 'pre',
          test: /\.(tsx?|jsx?)$/,
          exclude: /node_modules/,
          loader: 'eslint-loader',
          options: {
            emitWarning: true,
            failOnError: true,
            failOnWarning: false,
          },
        },
        {
          test: /\.ts$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
  });
};
