import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { generalLimiter, authLimiter } from './http/rateLimit.js';
import { authRouter } from './routes/auth.js';
import { instrumentsRouter } from './routes/instruments.js';
import { portfolioRouter } from './routes/portfolio.js';
import { groupsRouter } from './routes/groups.js';
import { feedRouter } from './routes/feed.js';
import { pushRouter } from './routes/push.js';
import { marketRouter } from './routes/market.js';
import { tournamentsRouter } from './routes/tournaments.js';
import { badgesRouter } from './routes/badges.js';
import { meRouter } from './routes/me.js';
import { sentimentRouter } from './routes/sentiment.js';
import { predictionsRouter } from './routes/predictions.js';
import { watchlistRouter } from './routes/watchlist.js';
import { dailyRouter } from './routes/daily.js';
import { wrappedRouter } from './routes/wrapped.js';
import { adminApiRouter } from './routes/admin.js';
import { errorHandler } from './http/errors.js';

/** Builds the Express application (separate from starting the server, for tests). */
export function createApp() {
  const app = express();
  // Required behind a proxy (Render/Railway) for correct per-IP rate limiting.
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use('/api', generalLimiter);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authLimiter, authRouter);
  app.use('/api/instruments', instrumentsRouter);
  app.use('/api/portfolio', portfolioRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/push', pushRouter);
  app.use('/api/market', marketRouter);
  app.use('/api', tournamentsRouter);
  app.use('/api', badgesRouter);
  app.use('/api', meRouter);
  app.use('/api', sentimentRouter);
  app.use('/api', predictionsRouter);
  app.use('/api', watchlistRouter);
  app.use('/api', dailyRouter);
  app.use('/api', wrappedRouter);
  app.use('/api', feedRouter);
  app.use('/api', adminApiRouter);

  app.use(errorHandler);
  return app;
}
