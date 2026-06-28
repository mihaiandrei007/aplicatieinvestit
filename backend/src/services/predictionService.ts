/**
 * Prediction service: places bets and resolves them on the next tick.
 * The win/payout logic is pure (lib/prediction); here only DB + notifications.
 */

import { prisma } from '../db.js';
import { validateStake, predictionWon, payout, DEFAULT_MULTIPLIER, type Direction } from '../lib/prediction.js';
import { hub } from '../realtime/hub.js';

/** Places a prediction: validates, holds the stake from cash, creates PENDING. */
export async function placePrediction(userId: string, symbol: string, direction: Direction, stake: number) {
  const instrument = await prisma.instrument.findUnique({ where: { symbol } });
  if (!instrument) throw new Error(`Instrument ${symbol} does not exist.`);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    validateStake(stake, user.cash);

    await tx.user.update({ where: { id: userId }, data: { cash: { decrement: stake } } });
    const prediction = await tx.prediction.create({
      data: {
        userId,
        symbol,
        direction,
        stake,
        multiplier: DEFAULT_MULTIPLIER,
        priceAtBet: instrument.currentPrice,
      },
    });
    return { prediction, cashAfter: user.cash - stake };
  });
}

/**
 * Resolves all pending predictions by comparing the bet price with the new one.
 * Called by tickMarket after the price update. `priceBySymbol` = new prices.
 */
export async function resolvePredictions(priceBySymbol: Readonly<Record<string, number>>): Promise<void> {
  const pending = await prisma.prediction.findMany({ where: { status: 'PENDING' } });
  if (pending.length === 0) return;

  for (const p of pending) {
    const after = priceBySymbol[p.symbol];
    if (after === undefined) continue;
    const won = predictionWon(p.direction as Direction, p.priceAtBet, after);
    const win = payout(won, p.stake, p.multiplier);

    await prisma.$transaction(async (tx) => {
      await tx.prediction.update({
        where: { id: p.id },
        data: { status: won ? 'WON' : 'LOST', payout: win, resolvedAt: new Date() },
      });
      if (won && win > 0) {
        await tx.user.update({ where: { id: p.userId }, data: { cash: { increment: win } } });
      }
    });

    hub.sendToUser(p.userId, {
      type: 'PREDICTION_RESOLVED',
      payload: { symbol: p.symbol, direction: p.direction, won, stake: p.stake, payout: win, priceAfter: after },
    });
  }
}
