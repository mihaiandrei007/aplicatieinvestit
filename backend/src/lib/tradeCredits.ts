/**
 * lib/tradeCredits — "the trade budget as currency" (inspired by Invstr).
 *
 * Each trade costs 1 credit. Credits are replenished at the daily check-in
 * (see lib/streak) and cannot exceed a cap. It's our anti-overtrading +
 * retention mechanic, replacing the old "per calendar day" limit.
 *
 * Pure, tested functions.
 */

export const DEFAULT_START = 20;
export const DEFAULT_MAX = 30;

/** You can trade if you have at least one credit. */
export function canTrade(credits: number): boolean {
  return credits >= 1;
}

/** Spends a credit. Throws if you have none left. */
export function spendCredit(credits: number): number {
  if (!canTrade(credits)) {
    throw new Error('You have no trade credits left. Check in tomorrow to get more.');
  }
  return credits - 1;
}

/** Adds credits, without exceeding the cap. Negative amounts are ignored. */
export function grantCredits(credits: number, amount: number, max = DEFAULT_MAX): number {
  return Math.min(max, credits + Math.max(0, amount));
}
