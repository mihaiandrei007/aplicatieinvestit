import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, badRequest, notFound } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { executeTrade } from '../lib/trading.js';
import { paginate } from '../lib/paginate.js';
import { buildSnapshot, loadTrades } from '../services/portfolioService.js';

export const portfolioRouter = Router();

/** Snapshot complet: numerar, dețineri, P&L, equity. */
portfolioRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await buildSnapshot(req.userId!));
  }),
);

/** Istoricul tranzacțiilor, paginat. */
portfolioRouter.get(
  '/transactions',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const txs = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { instrument: { select: { symbol: true, name: true } } },
    });
    const view = txs.map((t) => ({
      id: t.id,
      symbol: t.instrument.symbol,
      name: t.instrument.name,
      side: t.side,
      quantity: t.quantity,
      price: t.price,
      createdAt: t.createdAt,
    }));
    res.json(
      paginate(view, {
        page: Number(req.query.page ?? 1),
        pageSize: Number(req.query.pageSize ?? 20),
      }),
    );
  }),
);

const tradeSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(['BUY', 'SELL']),
  quantity: z.number().positive(),
});

/** Execută o cumpărare sau vânzare la prețul curent al instrumentului. */
portfolioRouter.post(
  '/trade',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = tradeSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Cerere invalidă.');
    const { symbol, side, quantity } = parsed.data;

    const instrument = await prisma.instrument.findUnique({ where: { symbol } });
    if (!instrument) throw notFound(`Instrumentul ${symbol} nu există.`);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: req.userId } });
      const history = await loadTrades(req.userId!);

      // Logica pură validează fonduri/dețineri și calculează noul numerar.
      const { cashAfter, trade, notional } = executeTrade(user.cash, history, {
        symbol,
        side,
        quantity,
        price: instrument.currentPrice,
      });

      await tx.user.update({ where: { id: user.id }, data: { cash: cashAfter } });
      const created = await tx.transaction.create({
        data: {
          userId: user.id,
          instrumentId: instrument.id,
          side: trade.side,
          quantity: trade.quantity,
          price: trade.price,
        },
      });
      return { created, cashAfter, notional };
    });

    res.status(201).json({
      transaction: {
        id: result.created.id,
        symbol,
        side,
        quantity,
        price: instrument.currentPrice,
        notional: result.notional,
      },
      cash: result.cashAfter,
    });
  }),
);
