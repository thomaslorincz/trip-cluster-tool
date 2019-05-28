import path from 'path';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../../webpack.dev.config.js';

const app = express();
const port = process.env.PORT || 8080;
const compiler = webpack(config);

app.use(webpackDevMiddleware(compiler, {publicPath: config.output.publicPath}));
app.use(webpackHotMiddleware(compiler));

app.get('/', (req, res, next) => {
  compiler.outputFileSystem.readFile(
      path.join(__dirname, 'index.html'),
      (err, result) => {
        if (err) return next(err);
        res.set('content-type', 'text/html');
        res.send(result);
        res.end();
      }
  );
});

app.listen(port, () => console.log(`Listening on port ${port}`));
