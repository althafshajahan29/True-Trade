import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { Express } from 'express';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

// The web build of apps/mobile (produced by `npm run build:web`), served
// from the same origin/port as the API so a single deployment is both the
// API and the website — no separate hosting or CORS config needed.
const webBuildDir = path.join(__dirname, '..', '..', 'mobile', 'dist');
const webBuildExists = fs.existsSync(path.join(webBuildDir, 'index.html'));

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  if (webBuildExists) {
    app.use(express.static(webBuildDir));
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'right-trade-api' });
  });

  app.use('/', apiRouter);

  if (webBuildExists) {
    // The mobile app has no URL-based routing (single-page, client-side
    // navigation only), so any other GET request is just the web app itself.
    app.get(/.*/, (req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(webBuildDir, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
