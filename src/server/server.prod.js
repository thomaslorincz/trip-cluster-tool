import express from 'express';
import helmet from 'helmet';
import expressStaticGzip from 'express-static-gzip';

const app = express();
const port = process.env.PORT || 8080;

app.use(helmet());

app.use('/', expressStaticGzip(__dirname, {
  enableBrotli: true,
  customCompressions: [],
  orderPreference: ['br'],
}));

app.listen(port, () => console.log(`Listening on port ${port}`));
