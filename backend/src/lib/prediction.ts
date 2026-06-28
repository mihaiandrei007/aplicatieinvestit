/**
 * lib/prediction — "Quick prediction" (themed semi-gambling).
 *
 * You stake virtual money that a stock will go up (UP) or down (DOWN) by the next
 * market tick. If you get the direction right, you receive the stake × multiplier;
 * otherwise you lose. A multiplier < 2 gives a small "house edge" — betting at random
 * loses slowly, but whoever interprets the market/news can come out ahead.
 *
 * Pure, tested functions.
 */

export type Direction = 'UP' | 'DOWN';

/** The payout multiplier for a correct prediction (≈ double). */
export const DEFAULT_MULTIPLIER = 1.9;
/** The minimum and maximum stake (in virtual money). */
export const MIN_STAKE = 10;
export const MAX_STAKE = 5000;

export function isDirection(value: string): value is Direction {
  return value === 'UP' || value === 'DOWN';
}

/** Validates the stake against the available cash. Throws a clear message if invalid. */
export function validateStake(stake: number, cash: number): void {
  if (!Number.isFinite(stake) || stake < MIN_STAKE) {
    throw new Error(`The minimum stake is ${MIN_STAKE}.`);
  }
  if (stake > MAX_STAKE) {
    throw new Error(`The maximum stake is ${MAX_STAKE}.`);
  }
  if (stake > cash + 1e-9) {
    throw new Error('You do not have enough cash for this stake.');
  }
}

/**
 * Decides whether the prediction was correct. No move (equal price) = a loss.
 */
export function predictionWon(direction: Direction, priceBefore: number, priceAfter: number): boolean {
  if (priceAfter === priceBefore) return false;
  const wentUp = priceAfter > priceBefore;
  return direction === 'UP' ? wentUp : !wentUp;
}

/** The payout: stake × multiplier if won, otherwise 0. */
export function payout(won: boolean, stake: number, multiplier = DEFAULT_MULTIPLIER): number {
  return won ? Math.round(stake * multiplier * 100) / 100 : 0;
}
