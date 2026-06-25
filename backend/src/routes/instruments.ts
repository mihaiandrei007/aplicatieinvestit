import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../http/errors.js';
import { requireAuth } from '../http/requireAuth.js';

export const instrumentsRouter = Router();

/** Lista instrumentelor tranzacționabile, cu prețul curent. */
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
      })),
    });
  }),
);
