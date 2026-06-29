import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler, notFound } from '../http/errors.js';
import { requireAuth } from '../http/requireAuth.js';

export const instrumentsRouter = Router();

/** List of tradable instruments, with the current price. */
instrumentsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const instruments = await prisma.instrument.findMany({ orderBy: { symbol: 'asc' } });
    res.json({
      instruments: instruments.map((i) => ({
        id: i.id,
        symbol: i.symbol,
        name: i.name,
        currentPrice: i.currentPrice,
        currency: i.currency,
        sector: i.sector,
      })),
    });
  }),
);

/** One instrument + its recent price history (for the detail chart). */
instrumentsRouter.get(
  '/:symbol',
  requireAuth,
  asyncHandler(async (req, res) => {
    const symbol = String(req.params.symbol).toUpperCase();
    const inst = await prisma.instrument.findUnique({ where: { symbol } });
    if (!inst) throw notFound('Instrument not found.');

    const recent = await prisma.pricePoint.findMany({
      where: { symbol },
      orderBy: { at: 'desc' },
      take: 80,
    });
    const points = recent.reverse().map((p) => ({ price: p.price, at: p.at }));

    res.json({
      instrument: {
        id: inst.id,
        symbol: inst.symbol,
        name: inst.name,
        currentPrice: inst.currentPrice,
        currency: inst.currency,
        sector: inst.sector,
      },
      points,
    });
  }),
);
