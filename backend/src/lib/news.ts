/**
 * lib/news — știri FALSE (simulate) care mișcă prețul unui instrument.
 *
 * Catalog de șabloane cu polaritate (+/-) și magnitudine. Generarea e
 * deterministă (primește un rng), deci toți utilizatorii văd aceleași știri.
 * Funcții pure, testate. Impactul se aplică în serviciul de piață.
 */

export interface NewsTemplate {
  /** +1 = veste bună (preț urcă), -1 = veste proastă. */
  polarity: 1 | -1;
  /** Magnitudinea mișcării (fracțiune, ex. 0.06 = 6%). */
  magnitude: number;
  /** Construiește titlul din numele companiei. */
  headline: (name: string) => string;
}

export const NEWS_TEMPLATES: readonly NewsTemplate[] = [
  { polarity: 1, magnitude: 0.07, headline: (n) => `${n} raportează rezultate trimestriale peste așteptări` },
  { polarity: 1, magnitude: 0.05, headline: (n) => `${n} lansează un produs nou primit entuziast de piață` },
  { polarity: 1, magnitude: 0.06, headline: (n) => `Un analist important ridică ținta de preț pentru ${n}` },
  { polarity: 1, magnitude: 0.04, headline: (n) => `${n} semnează un contract strategic major` },
  { polarity: 1, magnitude: 0.08, headline: (n) => `${n} depășește estimările și anunță răscumpărări de acțiuni` },
  { polarity: -1, magnitude: 0.07, headline: (n) => `${n} ratează estimările de venituri pe trimestru` },
  { polarity: -1, magnitude: 0.06, headline: (n) => `Investigație de reglementare anunțată la ${n}` },
  { polarity: -1, magnitude: 0.05, headline: (n) => `Analiștii retrogradează acțiunile ${n}` },
  { polarity: -1, magnitude: 0.08, headline: (n) => `${n} retrage un produs din cauza unor defecte` },
  { polarity: -1, magnitude: 0.04, headline: (n) => `Un director-cheie părăsește ${n}` },
];

export interface GeneratedNews {
  symbol: string;
  headline: string;
  /** Impact semnat asupra prețului (polaritate * magnitudine). */
  impact: number;
}

export interface Instrumentish {
  symbol: string;
  name: string;
}

/**
 * Poate genera o știre pentru un instrument ales determinist din `rng`.
 * Cu probabilitatea `probability` produce o știre; altfel `null`.
 */
export function maybeGenerateNews(
  rng: () => number,
  instruments: readonly Instrumentish[],
  probability = 0.5,
): GeneratedNews | null {
  if (instruments.length === 0) return null;
  if (rng() >= probability) return null;

  const inst = instruments[Math.floor(rng() * instruments.length)]!;
  const tpl = NEWS_TEMPLATES[Math.floor(rng() * NEWS_TEMPLATES.length)]!;
  return {
    symbol: inst.symbol,
    headline: tpl.headline(inst.name),
    impact: tpl.polarity * tpl.magnitude,
  };
}
