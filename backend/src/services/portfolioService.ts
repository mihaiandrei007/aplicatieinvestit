/**
 * Serviciu care leagă datele din DB de logica pură din lib/portfolio.
 * Nu conține reguli de business proprii — doar încărcare + delegare.
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

/** Construiește mapa simbol -> preț curent din toate instrumentele. */
async function currentPrices(): Promise<Record<string, number>> {
  const instruments = await prisma.instrument.findMany();
  return Object.fromEntries(instruments.map((i) => [i.symbol, i.currentPrice]));
}

/** Tranzacțiile unui utilizator, în formă pură (cronologic). */
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

/** Snapshot complet al portofoliului unui utilizator la prețurile curente. */
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

/** Doar capitalul total (equity) — folosit de clasament, evită calculul detaliat. */
export async function computeEquity(userId: string): Promise<{ equity: number; startingCash: number }> {
  const snapshot = await buildSnapshot(userId);
  return { equity: snapshot.equity, startingCash: snapshot.startingCash };
}
