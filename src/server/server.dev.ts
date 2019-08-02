import * as path from 'path';
import * as express from 'express';
import * as helmet from 'helmet';
import * as webpack from 'webpack';
import * as webpackDevMiddleware from 'webpack-dev-middleware';
import * as webpackHotMiddleware from 'webpack-hot-middleware';
import * as config from '../../webpack.dev.config.js';
import * as expressStaticGzip from 'express-static-gzip';

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

app.get('/', (req, res, next): void => {
  compiler.outputFileSystem.readFile(
      path.join(__dirname, 'index.html'),
      (err, result): void => {
        if (err) return next(err);
        res.set('content-type', 'text/html');
        res.send(result);
        res.end();
      }
  );
});

app.listen(port, (): void => console.log(`Listening on port ${port}`));
