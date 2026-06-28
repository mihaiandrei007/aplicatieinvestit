/**
 * lib/sentiment — Bullish/Bearish sentiment per symbol (inspired by Stocktwits).
 *
 * The aggregation is pure and tested. Each user has a single current position
 * per symbol; we aggregate at the group level as a "bullish" percentage.
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
  /** The "bullish" percentage of the total (0–100, integer). */
  bullishPct: number;
}

/** Aggregates a list of positions for ONE symbol. */
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

/** Aggregates by symbol all positions in a group, ordered by interest (total). */
export function summarizeBySymbol(rows: readonly SentimentRow[]): SentimentSummary[] {
  const symbols = [...new Set(rows.map((r) => r.symbol))];
  return symbols
    .map((s) => summarizeSymbol(s, rows))
    .sort((a, b) => b.total - a.total || a.symbol.localeCompare(b.symbol));
}
