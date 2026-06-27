import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, badRequest, notFound } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';

export const watchlistRouter = Router();

/** Simbolurile urmărite de mine. */
watchlistRouter.get(
  '/watchlist',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = await prisma.watchlist.findMany({ where: { userId: req.userId }, select: { symbol: true } });
    res.json({ symbols: rows.map((r) => r.symbol) });
  }),
);

const schema = z.object({ symbol: z.string().min(1) });

/** Comută urmărirea unui simbol (adaugă/scoate). */
watchlistRouter.post(
  '/watchlist',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Simbol invalid.');
    const { symbol } = parsed.data;
    const instrument = await prisma.instrument.findUnique({ where: { symbol } });
    if (!instrument) throw notFound(`Instrumentul ${symbol} nu există.`);

    const key = { userId_symbol: { userId: req.userId!, symbol } };
    const existing = await prisma.watchlist.findUnique({ where: key });
    if (existing) {
      await prisma.watchlist.delete({ where: key });
      res.json({ symbol, watching: false });
    } else {
      await prisma.watchlist.create({ data: { userId: req.userId!, symbol } });
      res.json({ symbol, watching: true });
    }
  }),
);
