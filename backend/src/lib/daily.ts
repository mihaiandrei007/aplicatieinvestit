/**
 * lib/daily — the daily challenge: one stock per day, the same for everyone.
 *
 * The stock choice is DETERMINISTIC from the date (YYYY-MM-DD), so all users
 * get the same challenge. The reward for guessing correctly = credits + virtual cash.
 *
 * Pure, tested functions.
 */

export const DAILY_REWARD_CASH = 500;
export const DAILY_REWARD_CREDITS = 3;

/** Simple deterministic hash for a string (FNV-1a, 32-bit). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Picks the challenge stock for a given date, deterministically. */
export function pickChallengeSymbol(date: string, symbols: readonly string[]): string | null {
  if (symbols.length === 0) return null;
  const sorted = [...symbols].sort();
  return sorted[hashString(date) % sorted.length]!;
}

/** Did the price go up from start to end? (equal = no). */
export function challengeWentUp(startPrice: number, endPrice: number): boolean {
  return endPrice > startPrice;
}
