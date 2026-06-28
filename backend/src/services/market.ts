/**
 * Market service: advances instrument prices (deterministic simulator),
 * persists them, broadcasts in real time and triggers notifications on price
 * jumps and on leaderboard overtakes.
 */

import { prisma } from '../db.js';
import { nextPrice, makeRng } from '../lib/priceSim.js';
import { isPriceJump, priceJumpPush, detectOvertakes, overtakePush, type RankSnapshot } from '../lib/notifications.js';
import { rankByRoi, type Participant } from '../lib/leaderboard.js';
import { netNotionalBySymbol, priceImpact, applyMove, type Flow } from '../lib/priceImpact.js';
import { applySectorCorrelation } from '../lib/correlation.js';
import { maybeGenerateNews } from '../lib/news.js';
import { SECTOR_LEADERS } from '../data/instruments.js';
import { resolvePredictions } from './predictionService.js';
import { hub } from '../realtime/hub.js';
import { computeEquity } from './portfolioService.js';
import { sendToUser } from './pushService.js';

/** The last known leaderboard per group, used to detect overtakes. */
const lastRankings = new Map<string, RankSnapshot[]>();
/** Time of the last tick — used to aggregate the trade flow over the interval. */
let lastTickAt: Date | null = null;

/**
 * Advances all prices by one step. The new price combines:
 *  1. the deterministic market move (lib/priceSim),
 *  2. supply/demand from the real trades in the interval (lib/priceImpact),
 *  3. the tick's possible fake news (lib/news).
 * Everything is global — all users see the same prices.
 */
export async function tickMarket(seed: number): Promise<Array<{ symbol: string; prev: number; next: number }>> {
  const instruments = await prisma.instrument.findMany();
  const since = lastTickAt;
  const now = new Date();

  // 1. Net trade flow over the interval (supply/demand).
  const recentTx = since
    ? await prisma.transaction.findMany({
        where: { createdAt: { gte: since } },
        include: { instrument: { select: { symbol: true } } },
      })
    : [];
  const flows: Flow[] = recentTx.map((t) => ({ symbol: t.instrument.symbol, side: t.side, quantity: t.quantity, price: t.price }));
  const netBySymbol = netNotionalBySymbol(flows);

  // 2. This tick's possible fake news (deterministic from the seed).
  const news = maybeGenerateNews(
    makeRng(seed * 7 + 13),
    instruments.map((i) => ({ symbol: i.symbol, name: i.name })),
    0.5,
  );
  if (news) {
    await prisma.news.create({
      data: { symbol: news.symbol, headline: news.headline, body: news.body, source: news.source, impact: news.impact },
    });
    // Broadcast without `impact` — the direction is not revealed, the user interprets it.
    hub.broadcastAll({ type: 'NEWS', payload: { symbol: news.symbol, headline: news.headline, body: news.body, source: news.source } });
  }

  // 3. Each instrument's OWN return (base + supply/demand + news).
  const ownReturn: Record<string, number> = {};
  for (let i = 0; i < instruments.length; i++) {
    const inst = instruments[i]!;
    const base = nextPrice(inst.currentPrice, { volatility: inst.volatility, drift: inst.drift }, seed * 1000 + i);
    const baseReturn = inst.currentPrice > 0 ? (base - inst.currentPrice) / inst.currentPrice : 0;
    const demand = priceImpact(netBySymbol[inst.symbol] ?? 0, inst.liquidity);
    const newsImpact = news?.symbol === inst.symbol ? news.impact : 0;
    ownReturn[inst.symbol] = baseReturn + demand + newsImpact;
  }

  // 4. Correlation overlay: followers pick up part of the sector leader's move.
  const finalReturn = applySectorCorrelation({
    members: instruments.map((i) => ({ symbol: i.symbol, sector: i.sector, correlation: i.correlation })),
    ownReturn,
    leaders: SECTOR_LEADERS,
  });

  const changes: Array<{ symbol: string; prev: number; next: number }> = [];
  for (const inst of instruments) {
    const next = applyMove(inst.currentPrice, finalReturn[inst.symbol] ?? 0);
    await prisma.instrument.update({ where: { id: inst.id }, data: { currentPrice: next } });
    changes.push({ symbol: inst.symbol, prev: inst.currentPrice, next });

    if (isPriceJump(inst.currentPrice, next)) {
      hub.broadcastAll({ type: 'PRICE_JUMP', payload: { symbol: inst.symbol, prev: inst.currentPrice, next } });
      await notifyHolders(inst.symbol, inst.currentPrice, next);
    }
  }

  lastTickAt = now;
  hub.broadcastAll({ type: 'PRICE_UPDATE', payload: changes });

  // Resolve the quick predictions with the new prices.
  await resolvePredictions(Object.fromEntries(changes.map((c) => [c.symbol, c.next])));
  await recheckOvertakes();
  return changes;
}

/** Notifies (push + live) the users who HOLD or WATCH a symbol that jumped. */
async function notifyHolders(symbol: string, prev: number, next: number): Promise<void> {
  const [holders, watchers] = await Promise.all([
    prisma.transaction.findMany({ where: { instrument: { symbol } }, select: { userId: true }, distinct: ['userId'] }),
    prisma.watchlist.findMany({ where: { symbol }, select: { userId: true } }),
  ]);
  const userIds = new Set<string>([...holders.map((h) => h.userId), ...watchers.map((w) => w.userId)]);
  const payload = priceJumpPush(symbol, prev, next);
  await Promise.all(
    [...userIds].map((uid) => {
      hub.sendToUser(uid, { type: 'PRICE_ALERT', payload: { symbol, prev, next, ...payload } });
      return sendToUser(uid, payload);
    }),
  );
}

/** Recomputes the leaderboards and emits overtake notifications. */
async function recheckOvertakes(): Promise<void> {
  const groups = await prisma.group.findMany({
    include: { memberships: { include: { user: { select: { id: true, displayName: true } } } } },
  });

  const snapshotted = new Set<string>();
  for (const group of groups) {
    const participants: Participant[] = await Promise.all(
      group.memberships.map(async (m) => {
        const { equity, startingCash } = await computeEquity(m.userId);
        // Record an equity snapshot once per user/tick.
        if (!snapshotted.has(m.userId)) {
          snapshotted.add(m.userId);
          await prisma.equitySnapshot.create({ data: { userId: m.userId, equity } });
        }
        return { userId: m.userId, displayName: m.user.displayName, startingCash, equity };
      }),
    );
    const current: RankSnapshot[] = rankByRoi(participants).map((e) => ({
      userId: e.userId,
      displayName: e.displayName,
      rank: e.rank,
    }));

    const previous = lastRankings.get(group.id);
    if (previous) {
      for (const ev of detectOvertakes(previous, current)) {
        const payload = overtakePush(ev, group.name);
        hub.sendToUser(ev.userId, { type: 'NOTIFICATION', payload });
        await sendToUser(ev.userId, payload);
      }
    }
    lastRankings.set(group.id, current);
  }
}
