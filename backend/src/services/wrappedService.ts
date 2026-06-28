/**
 * "Wrapped" service: a shareable summary of the user's activity.
 * Only aggregations over the existing data (no new rules).
 */

import { prisma } from '../db.js';
import { aggregate } from '../lib/portfolio.js';
import { buildSnapshot, loadTrades } from './portfolioService.js';

export async function getWrapped(userId: string) {
  const [user, snapshot, trades, predictions, badges] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    buildSnapshot(userId),
    loadTrades(userId),
    prisma.prediction.findMany({ where: { userId, status: { not: 'PENDING' } } }),
    prisma.badge.count({ where: { userId } }),
  ]);

  const { realizedPnL } = aggregate(trades);
  const distinctSymbols = new Set(trades.map((t) => t.symbol)).size;
  const roi = (snapshot.equity - snapshot.startingCash) / snapshot.startingCash;

  // The best current holding (by unrealized P&L).
  const best = [...snapshot.holdings].sort((a, b) => b.unrealizedPnL - a.unrealizedPnL)[0] ?? null;

  const predWon = predictions.filter((p) => p.status === 'WON').length;
  const predTotal = predictions.length;

  return {
    displayName: user.displayName,
    equity: snapshot.equity,
    roi,
    tradeCount: trades.length,
    distinctSymbols,
    realizedPnL,
    currentStreak: user.currentStreak,
    badges,
    bestHolding: best ? { symbol: best.symbol, unrealizedPnL: best.unrealizedPnL } : null,
    predictions: { total: predTotal, won: predWon, winRate: predTotal > 0 ? predWon / predTotal : 0 },
  };
}
