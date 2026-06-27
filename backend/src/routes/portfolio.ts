import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, badRequest, notFound } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { executeTrade } from '../lib/trading.js';
import { paginate } from '../lib/paginate.js';
import { canTrade, spendCredit } from '../lib/tradeCredits.js';
import { actionLimiter } from '../http/rateLimit.js';
import { buildSnapshot, loadTrades } from '../services/portfolioService.js';
import { emitToUserGroups } from '../services/activityService.js';
import { awardBadges } from '../services/gamificationService.js';

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

/** Istoricul de capital (equity) pentru grafic — instantanee cronologice. */
portfolioRouter.get(
  '/history',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const snapshots = await prisma.equitySnapshot.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: { equity: true, createdAt: true },
    });
    res.json({ history: snapshots });
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
  actionLimiter,
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = tradeSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Cerere invalidă.');
    const { symbol, side, quantity } = parsed.data;

    const instrument = await prisma.instrument.findUnique({ where: { symbol } });
    if (!instrument) throw notFound(`Instrumentul ${symbol} nu există.`);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({ where: { id: req.userId } });

      // Anti-overtrading: fiecare tranzacție costă 1 credit (lib/tradeCredits).
      if (!canTrade(user.tradeCredits)) {
        throw badRequest('Nu mai ai credite de tranzacționare. Fă check-in zilnic ca să primești.');
      }
      const creditsAfter = spendCredit(user.tradeCredits);

      const history = await loadTrades(req.userId!);

      // Logica pură validează fonduri/dețineri și calculează noul numerar.
      const { cashAfter, trade, notional } = executeTrade(user.cash, history, {
        symbol,
        side,
        quantity,
        price: instrument.currentPrice,
      });

      await tx.user.update({ where: { id: user.id }, data: { cash: cashAfter, tradeCredits: creditsAfter } });
      const created = await tx.transaction.create({
        data: {
          userId: user.id,
          instrumentId: instrument.id,
          side: trade.side,
          quantity: trade.quantity,
          price: trade.price,
        },
      });

      // Stratul social: anunță grupurile despre tranzacție (atomic cu trade-ul).
      await emitToUserGroups(
        user.id,
        'TRADE',
        { symbol, side: trade.side, quantity: trade.quantity, price: trade.price },
        tx,
      );
      return { created, cashAfter, notional, creditsAfter };
    });

    // Înregistrează un instantaneu de capital pentru grafic/Sharpe.
    const snapshot = await buildSnapshot(req.userId!);
    await prisma.equitySnapshot.create({ data: { userId: req.userId!, equity: snapshot.equity } });

    // După trade: evaluează insignele nou câștigate (idempotent).
    const newBadges = await awardBadges(req.userId!);

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
      tradeCredits: result.creditsAfter,
      newBadges,
    });
  }),
);
