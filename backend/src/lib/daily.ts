/**
 * lib/daily — provocarea zilnică: o acțiune pe zi, aceeași pentru toți.
 *
 * Alegerea acțiunii e DETERMINISTĂ din data (YYYY-MM-DD), deci toți utilizatorii
 * primesc aceeași provocare. Recompensa pentru ghicirea corectă = credite + cash virtual.
 *
 * Funcții pure, testate.
 */

export const DAILY_REWARD_CASH = 500;
export const DAILY_REWARD_CREDITS = 3;

/** Hash determinist simplu pentru un string (FNV-1a, 32-bit). */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Alege acțiunea provocării pentru o dată dată, determinist. */
export function pickChallengeSymbol(date: string, symbols: readonly string[]): string | null {
  if (symbols.length === 0) return null;
  const sorted = [...symbols].sort();
  return sorted[hashString(date) % sorted.length]!;
}

/** A urcat prețul de la start la final? (egal = nu). */
export function challengeWentUp(startPrice: number, endPrice: number): boolean {
  return endPrice > startPrice;
}
