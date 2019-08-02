import * as express from 'express';
import * as helmet from 'helmet';
import * as expressStaticGzip from 'express-static-gzip';

const app = express();
const port = process.env.PORT || 8080;

const sslRedirect = (req, res, next): void => {
  if (req.headers['x-forwarded-proto'] === 'https') {
    return next();
  } else {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
};

app.use(helmet());
// Only use SSL redirect on deployed servers
if (port === process.env.PORT) {
  app.use(sslRedirect);
}
app.use('/', expressStaticGzip(__dirname, {
  enableBrotli: true,
  customCompressions: [],
  orderPreference: ['br'],
}));

app.listen(port, (): void => console.log(`Listening on port ${port}`));
