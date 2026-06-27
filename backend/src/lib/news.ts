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

/**
 * Catalog de știri AMBIGUE: titlul nu trădează direcția prețului. Polaritatea și
 * magnitudinea sunt interne (mișcă prețul), dar utilizatorul trebuie să INTERPRETEZE
 * știrea — nu i se spune dacă stocul urcă sau coboară.
 */
export const NEWS_TEMPLATES: readonly NewsTemplate[] = [
  { polarity: 1, magnitude: 0.05, headline: (n) => `${n} anunță o investiție mare într-o nouă fabrică` },
  { polarity: 1, magnitude: 0.06, headline: (n) => `${n} este în discuții pentru o posibilă achiziție` },
  { polarity: 1, magnitude: 0.04, headline: (n) => `Un fond mare își crește expunerea pe ${n}` },
  { polarity: 1, magnitude: 0.05, headline: (n) => `${n} își extinde operațiunile pe o piață nouă` },
  { polarity: 1, magnitude: 0.07, headline: (n) => `Zvonuri despre un parteneriat surpriză la ${n}` },
  { polarity: 1, magnitude: 0.04, headline: (n) => `${n} schimbă strategia pentru următorul an` },
  { polarity: -1, magnitude: 0.05, headline: (n) => `${n} amână lansarea unui produs așteptat` },
  { polarity: -1, magnitude: 0.06, headline: (n) => `Volatilitate crescută pe ${n} înaintea raportării` },
  { polarity: -1, magnitude: 0.04, headline: (n) => `Un investitor activist apare în acționariatul ${n}` },
  { polarity: -1, magnitude: 0.05, headline: (n) => `${n} înlocuiește un director important` },
  { polarity: -1, magnitude: 0.07, headline: (n) => `Presa scrie despre tensiuni interne la ${n}` },
  { polarity: -1, magnitude: 0.04, headline: (n) => `${n} reduce estimările pentru un segment de business` },
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
