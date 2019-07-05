import path from 'path';
import express from 'express';
import helmet from 'helmet';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import config from '../../webpack.dev.config.js';
import expressStaticGzip from 'express-static-gzip';

const app = express();
const port = process.env.PORT || 8080;
const compiler = webpack(config);

app.use(helmet());
app.use(webpackDevMiddleware(compiler, {publicPath: config.output.publicPath}));
app.use(webpackHotMiddleware(compiler));
app.use('/', expressStaticGzip(__dirname, {
  enableBrotli: true,
  customCompressions: [],
  orderPreference: ['br'],
}));

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
