/**
 * Serviciu de piață: avansează prețurile instrumentelor (simulator determinist),
 * persistă, difuzează în timp real și declanșează notificări la salturi și
 * la depășiri în clasament.
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

/** Ultimul clasament cunoscut per grup, pentru a detecta depășiri. */
const lastRankings = new Map<string, RankSnapshot[]>();
/** Momentul ultimului tick — pentru a aduna fluxul de tranzacții din interval. */
let lastTickAt: Date | null = null;

/**
 * Avansează toate prețurile cu un pas. Prețul nou combină:
 *  1. mișcarea de piață deterministă (lib/priceSim),
 *  2. cererea/oferta din tranzacțiile reale din interval (lib/priceImpact),
 *  3. eventuala știre falsă a tick-ului (lib/news).
 * Totul e global — toți utilizatorii văd aceleași prețuri.
 */
export async function tickMarket(seed: number): Promise<Array<{ symbol: string; prev: number; next: number }>> {
  const instruments = await prisma.instrument.findMany();
  const since = lastTickAt;
  const now = new Date();

  // 1. Flux net de tranzacții din interval (cerere/ofertă).
  const recentTx = since
    ? await prisma.transaction.findMany({
        where: { createdAt: { gte: since } },
        include: { instrument: { select: { symbol: true } } },
      })
    : [];
  const flows: Flow[] = recentTx.map((t) => ({ symbol: t.instrument.symbol, side: t.side, quantity: t.quantity, price: t.price }));
  const netBySymbol = netNotionalBySymbol(flows);

  // 2. Eventuală știre falsă a acestui tick (deterministă din seed).
  const news = maybeGenerateNews(
    makeRng(seed * 7 + 13),
    instruments.map((i) => ({ symbol: i.symbol, name: i.name })),
    0.5,
  );
  if (news) {
    await prisma.news.create({
      data: { symbol: news.symbol, headline: news.headline, body: news.body, source: news.source, impact: news.impact },
    });
    // Difuzăm fără `impact` — direcția nu se dezvăluie, utilizatorul interpretează.
    hub.broadcastAll({ type: 'NEWS', payload: { symbol: news.symbol, headline: news.headline, body: news.body, source: news.source } });
  }

  // 3. Randamentul PROPRIU al fiecărui instrument (bază + cerere/ofertă + știre).
  const ownReturn: Record<string, number> = {};
  for (let i = 0; i < instruments.length; i++) {
    const inst = instruments[i]!;
    const base = nextPrice(inst.currentPrice, { volatility: inst.volatility, drift: inst.drift }, seed * 1000 + i);
    const baseReturn = inst.currentPrice > 0 ? (base - inst.currentPrice) / inst.currentPrice : 0;
    const demand = priceImpact(netBySymbol[inst.symbol] ?? 0, inst.liquidity);
    const newsImpact = news?.symbol === inst.symbol ? news.impact : 0;
    ownReturn[inst.symbol] = baseReturn + demand + newsImpact;
  }

  // 4. Overlay de corelație: urmăritorii preiau o parte din mișcarea liderului de sector.
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

  // Rezolvă predicțiile rapide cu prețurile noi.
  await resolvePredictions(Object.fromEntries(changes.map((c) => [c.symbol, c.next])));
  await recheckOvertakes();
  return changes;
}

/** Notifică (push + live) utilizatorii care DEȚIN sau URMĂRESC un simbol care a sărit. */
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

/** Recalculează clasamentele și emite notificări de depășire. */
async function recheckOvertakes(): Promise<void> {
  const groups = await prisma.group.findMany({
    include: { memberships: { include: { user: { select: { id: true, displayName: true } } } } },
  });

  const snapshotted = new Set<string>();
  for (const group of groups) {
    const participants: Participant[] = await Promise.all(
      group.memberships.map(async (m) => {
        const { equity, startingCash } = await computeEquity(m.userId);
        // Înregistrează un instantaneu de capital o singură dată per utilizator/tick.
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
