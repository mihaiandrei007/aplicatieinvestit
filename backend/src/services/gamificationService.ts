/**
 * Serviciu de gamificare: calculează statisticile unui utilizator și acordă
 * insignele nou câștigate. Delegă regulile către lib/gamification (pur, testat).
 */

import { prisma } from '../db.js';
import { aggregate } from '../lib/portfolio.js';
import { newlyEarnedBadges, BADGES, type UserStats } from '../lib/gamification.js';
import { computeEquity } from './portfolioService.js';
import { loadTrades } from './portfolioService.js';

/** Adună statisticile relevante pentru insigne. */
export async function buildUserStats(userId: string): Promise<UserStats> {
  const [trades, equityInfo, membershipCount] = await Promise.all([
    loadTrades(userId),
    computeEquity(userId),
    prisma.membership.count({ where: { userId } }),
  ]);

  const distinctSymbols = new Set(trades.map((t) => t.symbol)).size;
  const { realizedPnL } = aggregate(trades);
  const roi = (equityInfo.equity - equityInfo.startingCash) / equityInfo.startingCash;

  return {
    tradeCount: trades.length,
    distinctSymbols,
    roi,
    realizedPnL,
    inGroup: membershipCount > 0,
  };
}

/**
 * Evaluează și persistă insignele nou câștigate. Întoarce definițiile lor
 * (pentru afișare/notificare). Idempotent: nu re-acordă insigne deținute.
 */
export async function awardBadges(userId: string): Promise<Array<{ code: string; label: string }>> {
  const stats = await buildUserStats(userId);
  const owned = await prisma.badge.findMany({ where: { userId }, select: { code: true } });
  const fresh = newlyEarnedBadges(
    stats,
    owned.map((b) => b.code),
  );
  if (fresh.length === 0) return [];

  await prisma.badge.createMany({
    data: fresh.map((code) => ({ userId, code })),
    skipDuplicates: true,
  });

  const byCode = new Map(BADGES.map((b) => [b.code, b]));
  return fresh.map((code) => ({ code, label: byCode.get(code)?.label ?? code }));
}
