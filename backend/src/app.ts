import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { instrumentsRouter } from './routes/instruments.js';
import { portfolioRouter } from './routes/portfolio.js';
import { groupsRouter } from './routes/groups.js';
import { feedRouter } from './routes/feed.js';
import { pushRouter } from './routes/push.js';
import { marketRouter } from './routes/market.js';
import { tournamentsRouter } from './routes/tournaments.js';
import { badgesRouter } from './routes/badges.js';
import { academyRouter } from './routes/academy.js';
import { meRouter } from './routes/me.js';
import { sentimentRouter } from './routes/sentiment.js';
import { predictionsRouter } from './routes/predictions.js';
import { errorHandler } from './http/errors.js';

/** Construiește aplicația Express (separat de pornirea serverului, pt. teste). */
export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter);
  app.use('/api/instruments', instrumentsRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/push', pushRouter);
  app.use('/api/market', marketRouter);
  app.use('/api', tournamentsRouter);
  app.use('/api', badgesRouter);
  app.use('/api', academyRouter);
  app.use('/api', meRouter);
  app.use('/api', sentimentRouter);
  app.use('/api', predictionsRouter);
  app.use('/api', feedRouter);

  app.use(errorHandler);
  return app;
}
