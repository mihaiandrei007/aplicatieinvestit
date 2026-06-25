/**
 * Serviciu de piață: avansează prețurile instrumentelor (simulator determinist),
 * persistă, difuzează în timp real și declanșează notificări la salturi și
 * la depășiri în clasament.
 */

import { prisma } from '../db.js';
import { nextPrice } from '../lib/priceSim.js';
import { isPriceJump, priceJumpPush, detectOvertakes, overtakePush, type RankSnapshot } from '../lib/notifications.js';
import { rankByRoi, type Participant } from '../lib/leaderboard.js';
import { hub } from '../realtime/hub.js';
import { computeEquity } from './portfolioService.js';
import { sendToUser } from './pushService.js';

/** Ultimul clasament cunoscut per grup, pentru a detecta depășiri. */
const lastRankings = new Map<string, RankSnapshot[]>();

/**
 * Avansează toate prețurile cu un pas. `seed` face avansul reproductibil
 * (în producție poate fi un contor de tick). Întoarce variațiile aplicate.
 */
export async function tickMarket(seed: number): Promise<Array<{ symbol: string; prev: number; next: number }>> {
  const instruments = await prisma.instrument.findMany();
  const changes: Array<{ symbol: string; prev: number; next: number }> = [];

  for (let i = 0; i < instruments.length; i++) {
    const inst = instruments[i]!;
    const next = nextPrice(
      inst.currentPrice,
      { volatility: inst.volatility, drift: inst.drift },
      seed * 1000 + i,
    );
    await prisma.instrument.update({ where: { id: inst.id }, data: { currentPrice: next } });
    changes.push({ symbol: inst.symbol, prev: inst.currentPrice, next });

    if (isPriceJump(inst.currentPrice, next)) {
      hub.broadcastAll({ type: 'PRICE_JUMP', payload: { symbol: inst.symbol, prev: inst.currentPrice, next } });
      await notifyHolders(inst.symbol, inst.currentPrice, next);
    }
  }

  hub.broadcastAll({ type: 'PRICE_UPDATE', payload: changes });
  await recheckOvertakes();
  return changes;
}

/** Notifică (push) utilizatorii care dețin un simbol care a sărit. */
async function notifyHolders(symbol: string, prev: number, next: number): Promise<void> {
  const holders = await prisma.transaction.findMany({
    where: { instrument: { symbol } },
    select: { userId: true },
    distinct: ['userId'],
  });
  const payload = priceJumpPush(symbol, prev, next);
  await Promise.all(holders.map((h) => sendToUser(h.userId, payload)));
}

/** Recalculează clasamentele și emite notificări de depășire. */
async function recheckOvertakes(): Promise<void> {
  const groups = await prisma.group.findMany({
    include: { memberships: { include: { user: { select: { id: true, displayName: true } } } } },
  });

  for (const group of groups) {
    const participants: Participant[] = await Promise.all(
      group.memberships.map(async (m) => {
        const { equity, startingCash } = await computeEquity(m.userId);
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
