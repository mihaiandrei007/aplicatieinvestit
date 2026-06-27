/**
 * lib/prediction — „Predicție rapidă" (semi-gambling tematic).
 *
 * Mizezi bani virtuali că o acțiune urcă (UP) sau coboară (DOWN) până la următorul
 * tick de piață. Dacă nimerești direcția, primești miza × multiplicator; altfel pierzi.
 * Multiplicatorul < 2 dă un mic „avantaj al casei" — pariatul la noroc pierde lent,
 * dar cine interpretează piața/știrile poate ieși pe plus.
 *
 * Funcții pure, testate.
 */

export type Direction = 'UP' | 'DOWN';

/** Multiplicatorul de plată la o predicție corectă (≈ dublu). */
export const DEFAULT_MULTIPLIER = 1.9;
/** Miza minimă și maximă (în bani virtuali). */
export const MIN_STAKE = 10;
export const MAX_STAKE = 5000;

export function isDirection(value: string): value is Direction {
  return value === 'UP' || value === 'DOWN';
}

/** Validează miza față de numerarul disponibil. Aruncă mesaj clar dacă e invalidă. */
export function validateStake(stake: number, cash: number): void {
  if (!Number.isFinite(stake) || stake < MIN_STAKE) {
    throw new Error(`Miza minimă este ${MIN_STAKE}.`);
  }
  if (stake > MAX_STAKE) {
    throw new Error(`Miza maximă este ${MAX_STAKE}.`);
  }
  if (stake > cash + 1e-9) {
    throw new Error('Nu ai suficient numerar pentru această miză.');
  }
}

/**
 * Decide dacă predicția a fost corectă. Fără mișcare (preț egal) = pierdere.
 */
export function predictionWon(direction: Direction, priceBefore: number, priceAfter: number): boolean {
  if (priceAfter === priceBefore) return false;
  const wentUp = priceAfter > priceBefore;
  return direction === 'UP' ? wentUp : !wentUp;
}

/** Plata: miza × multiplicator dacă a câștigat, altfel 0. */
export function payout(won: boolean, stake: number, multiplier = DEFAULT_MULTIPLIER): number {
  return won ? Math.round(stake * multiplier * 100) / 100 : 0;
}
