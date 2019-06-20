import express from 'express';
import helmet from 'helmet';
import sslRedirect from 'heroku-ssl-redirect';
import expressStaticGzip from 'express-static-gzip';

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());
app.use(sslRedirect());
app.use('/', expressStaticGzip(__dirname, {
  enableBrotli: true,
  customCompressions: [],
  orderPreference: ['br'],
}));

app.listen(port, () => console.log(`Listening on port ${port}`));
