/**
 * lib/sentiment — sentiment Bullish/Bearish per simbol (inspirat din Stocktwits).
 *
 * Agregarea e pură și testată. Fiecare utilizator are o singură poziție curentă
 * per simbol; agregăm la nivel de grup ca procent „bullish".
 */

export type SentimentValue = 'BULLISH' | 'BEARISH';

export function isSentimentValue(value: string): value is SentimentValue {
  return value === 'BULLISH' || value === 'BEARISH';
}

export interface SentimentRow {
  symbol: string;
  value: SentimentValue;
}

export interface SentimentSummary {
  symbol: string;
  bullish: number;
  bearish: number;
  total: number;
  /** Procentul de „bullish" din total (0–100, întreg). */
  bullishPct: number;
}

/** Agregă o listă de poziții pentru UN simbol. */
export function summarizeSymbol(symbol: string, rows: readonly SentimentRow[]): SentimentSummary {
  let bullish = 0;
  let bearish = 0;
  for (const r of rows) {
    if (r.symbol !== symbol) continue;
    if (r.value === 'BULLISH') bullish += 1;
    else bearish += 1;
  }
  const total = bullish + bearish;
  return { symbol, bullish, bearish, total, bullishPct: total === 0 ? 0 : Math.round((bullish / total) * 100) };
}

/** Agregă pe simboluri toate pozițiile dintr-un grup, ordonate după interes (total). */
export function summarizeBySymbol(rows: readonly SentimentRow[]): SentimentSummary[] {
  const symbols = [...new Set(rows.map((r) => r.symbol))];
  return symbols
    .map((s) => summarizeSymbol(s, rows))
    .sort((a, b) => b.total - a.total || a.symbol.localeCompare(b.symbol));
}
