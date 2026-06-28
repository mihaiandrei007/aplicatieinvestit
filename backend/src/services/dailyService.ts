/**
 * Service for the daily challenge. Creates the day's challenge (deterministically),
 * resolves previous challenges at rollover and grants rewards.
 */

import { prisma } from '../db.js';
import { pickChallengeSymbol, challengeWentUp, DAILY_REWARD_CASH, DAILY_REWARD_CREDITS } from '../lib/daily.js';
import type { Direction } from '../lib/prediction.js';
import { hub } from '../realtime/hub.js';

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Resolves the open challenges from past days: result + rewards. */
async function resolvePastChallenges(today: string): Promise<void> {
  const open = await prisma.dailyChallenge.findMany({ where: { status: 'OPEN', date: { not: today } } });
  for (const ch of open) {
    const instrument = await prisma.instrument.findUnique({ where: { symbol: ch.symbol } });
    if (!instrument) continue;
    const up = challengeWentUp(ch.startPrice, instrument.currentPrice);

    await prisma.dailyChallenge.update({
      where: { id: ch.id },
      data: { status: 'RESOLVED', endPrice: instrument.currentPrice, resultUp: up },
    });

    const entries = await prisma.dailyChallengeEntry.findMany({ where: { challengeId: ch.id } });
    for (const e of entries) {
      const correct = (e.direction === 'UP') === up;
      await prisma.dailyChallengeEntry.update({ where: { id: e.id }, data: { correct } });
      if (correct) {
        await prisma.user.update({
          where: { id: e.userId },
          data: { cash: { increment: DAILY_REWARD_CASH }, tradeCredits: { increment: DAILY_REWARD_CREDITS } },
        });
        hub.sendToUser(e.userId, {
          type: 'DAILY_RESOLVED',
          payload: { symbol: ch.symbol, up, rewardCash: DAILY_REWARD_CASH, rewardCredits: DAILY_REWARD_CREDITS },
        });
      }
    }
  }
}

/** Today's challenge (creates it if it doesn't exist) + voting statistics. */
export async function getTodayChallenge(userId: string) {
  const today = todayString();
  await resolvePastChallenges(today);

  let challenge = await prisma.dailyChallenge.findUnique({ where: { date: today } });
  if (!challenge) {
    const instruments = await prisma.instrument.findMany({ select: { symbol: true } });
    const symbol = pickChallengeSymbol(today, instruments.map((i) => i.symbol));
    if (!symbol) throw new Error('There are no instruments for the challenge.');
    const inst = await prisma.instrument.findUniqueOrThrow({ where: { symbol } });
    challenge = await prisma.dailyChallenge.create({ data: { date: today, symbol, startPrice: inst.currentPrice } });
  }

  const [instrument, myEntry, up, down] = await Promise.all([
    prisma.instrument.findUnique({ where: { symbol: challenge.symbol } }),
    prisma.dailyChallengeEntry.findUnique({ where: { challengeId_userId: { challengeId: challenge.id, userId } } }),
    prisma.dailyChallengeEntry.count({ where: { challengeId: challenge.id, direction: 'UP' } }),
    prisma.dailyChallengeEntry.count({ where: { challengeId: challenge.id, direction: 'DOWN' } }),
  ]);

  return {
    date: challenge.date,
    symbol: challenge.symbol,
    name: instrument?.name ?? challenge.symbol,
    startPrice: challenge.startPrice,
    currentPrice: instrument?.currentPrice ?? challenge.startPrice,
    myDirection: myEntry?.direction ?? null,
    votesUp: up,
    votesDown: down,
    reward: { cash: DAILY_REWARD_CASH, credits: DAILY_REWARD_CREDITS },
  };
}

/** Submits the vote (only once per day). */
export async function submitDaily(userId: string, direction: Direction) {
  const today = todayString();
  const challenge = await prisma.dailyChallenge.findUnique({ where: { date: today } });
  if (!challenge) throw new Error("Today's challenge is not available yet.");

  const existing = await prisma.dailyChallengeEntry.findUnique({
    where: { challengeId_userId: { challengeId: challenge.id, userId } },
  });
  if (existing) throw new Error('You have already voted today. Come back tomorrow.');

  await prisma.dailyChallengeEntry.create({ data: { challengeId: challenge.id, userId, direction } });
}
