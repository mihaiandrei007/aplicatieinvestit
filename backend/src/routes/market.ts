import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../http/errors.js';
import { requireAuth } from '../http/requireAuth.js';
import { tickMarket } from '../services/market.js';

export const marketRouter = Router();

let tickCounter = 1;

/**
 * Manually advance the market by one step (dev/demo).
 * In production this runs on a timer (see server.ts) or on a cron.
 */
marketRouter.post(
  '/tick',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const changes = await tickMarket(tickCounter++);
    res.json({ tick: tickCounter - 1, changes });
  }),
);

/** Current market prices. */
marketRouter.get(
  '/prices',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const instruments = await prisma.instrument.findMany({ orderBy: { symbol: 'asc' } });
    res.json({ prices: instruments.map((i) => ({ symbol: i.symbol, price: i.currentPrice })) });
  }),
);

/** The news feed (most recent). Optionally filterable by symbol. */
marketRouter.get(
  '/news',
  requireAuth,
  asyncHandler(async (req, res) => {
    const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : undefined;
    const news = await prisma.news.findMany({
      where: symbol ? { symbol } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    // We don't expose `impact` — the user must interpret the news themselves.
    res.json({
      news: news.map((n) => ({ id: n.id, symbol: n.symbol, headline: n.headline, body: n.body, source: n.source, createdAt: n.createdAt })),
    });
  }),
);
