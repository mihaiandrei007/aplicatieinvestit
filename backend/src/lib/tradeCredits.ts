/**
 * lib/tradeCredits — „bugetul de tranzacții ca monedă" (inspirat din Invstr).
 *
 * Fiecare tranzacție costă 1 credit. Creditele se reîncarcă la check-in zilnic
 * (vezi lib/streak) și nu pot depăși un plafon. E mecanica noastră de
 * anti-overtrading + retenție, înlocuind vechea limită „pe zi calendaristică".
 *
 * Funcții pure, testate.
 */

export const DEFAULT_START = 20;
export const DEFAULT_MAX = 30;

/** Poți tranzacționa dacă ai cel puțin un credit. */
export function canTrade(credits: number): boolean {
  return credits >= 1;
}

/** Consumă un credit. Aruncă dacă nu mai ai. */
export function spendCredit(credits: number): number {
  if (!canTrade(credits)) {
    throw new Error('Nu mai ai credite de tranzacționare. Fă check-in mâine ca să primești.');
  }
  return credits - 1;
}

/** Adaugă credite, fără a depăși plafonul. Sumele negative sunt ignorate. */
export function grantCredits(credits: number, amount: number, max = DEFAULT_MAX): number {
  return Math.min(max, credits + Math.max(0, amount));
}
