import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { instrumentsRouter } from './routes/instruments.js';
import { portfolioRouter } from './routes/portfolio.js';
import { groupsRouter } from './routes/groups.js';
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

  app.use(errorHandler);
  return app;
}
