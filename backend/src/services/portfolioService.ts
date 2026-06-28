/**
 * Service that connects the DB data to the pure logic in lib/portfolio.
 * Contains no business rules of its own — only loading + delegation.
 */

import { prisma } from '../db.js';
import { aggregate, accountEquity, unrealizedPnL, type Trade } from '../lib/portfolio.js';

export interface PortfolioSnapshot {
  cash: number;
  startingCash: number;
  equity: number;
  realizedPnL: number;
  unrealizedPnL: number;
  tradeCredits: number;
  currentStreak: number;
  holdings: Array<{
    symbol: string;
    quantity: number;
    avgCost: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPnL: number;
  }>;
}

/** Builds the symbol -> current price map from all instruments. */
async function currentPrices(): Promise<Record<string, number>> {
  const instruments = await prisma.instrument.findMany();
  return Object.fromEntries(instruments.map((i) => [i.symbol, i.currentPrice]));
}

/** A user's transactions, in pure form (chronological). */
export async function loadTrades(userId: string): Promise<Trade[]> {
  const txs = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: { instrument: { select: { symbol: true } } },
  });
  return txs.map((t) => ({
    symbol: t.instrument.symbol,
    side: t.side,
    quantity: t.quantity,
    price: t.price,
  }));
}

/** Full snapshot of a user's portfolio at current prices. */
export async function buildSnapshot(userId: string): Promise<PortfolioSnapshot> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const [trades, prices] = await Promise.all([loadTrades(userId), currentPrices()]);
  const { holdings, realizedPnL } = aggregate(trades);

  const detailed = holdings.map((h) => {
    const currentPrice = prices[h.symbol] ?? h.avgCost;
    return {
      symbol: h.symbol,
      quantity: h.quantity,
      avgCost: h.avgCost,
      currentPrice,
      marketValue: h.quantity * currentPrice,
      unrealizedPnL: unrealizedPnL(h, currentPrice),
    };
  });

  const equity = accountEquity(
    user.cash,
    holdings,
    Object.fromEntries(detailed.map((d) => [d.symbol, d.currentPrice])),
  );

  return {
    cash: user.cash,
    startingCash: user.startingCash,
    equity,
    realizedPnL,
    unrealizedPnL: detailed.reduce((s, d) => s + d.unrealizedPnL, 0),
    tradeCredits: user.tradeCredits,
    currentStreak: user.currentStreak,
    holdings: detailed,
  };
}

/** Just the total equity — used by the leaderboard, avoids the detailed computation. */
export async function computeEquity(userId: string): Promise<{ equity: number; startingCash: number }> {
  const snapshot = await buildSnapshot(userId);
  return { equity: snapshot.equity, startingCash: snapshot.startingCash };
}
