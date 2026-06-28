import { describe, it, expect } from 'vitest';
import { summarizeSymbol, summarizeBySymbol, isSentimentValue, type SentimentRow } from './sentiment.js';

describe('isSentimentValue', () => {
  it('accepts only BULLISH/BEARISH', () => {
    expect(isSentimentValue('BULLISH')).toBe(true);
    expect(isSentimentValue('BEARISH')).toBe(true);
    expect(isSentimentValue('NEUTRAL')).toBe(false);
  });
});

describe('summarizeSymbol', () => {
  const rows: SentimentRow[] = [
    { symbol: 'AAPL', value: 'BULLISH' },
    { symbol: 'AAPL', value: 'BULLISH' },
    { symbol: 'AAPL', value: 'BEARISH' },
    { symbol: 'TSLA', value: 'BEARISH' },
  ];

  it('counts and computes the bullish percentage', () => {
    expect(summarizeSymbol('AAPL', rows)).toEqual({ symbol: 'AAPL', bullish: 2, bearish: 1, total: 3, bullishPct: 67 });
  });

  it('symbol with no positions => 0%', () => {
    expect(summarizeSymbol('MSFT', rows)).toEqual({ symbol: 'MSFT', bullish: 0, bearish: 0, total: 0, bullishPct: 0 });
  });
});

describe('summarizeBySymbol', () => {
  const rows: SentimentRow[] = [
    { symbol: 'AAPL', value: 'BULLISH' },
    { symbol: 'AAPL', value: 'BEARISH' },
    { symbol: 'TSLA', value: 'BULLISH' },
  ];

  it('orders by interest (total) descending', () => {
    const out = summarizeBySymbol(rows);
    expect(out.map((s) => s.symbol)).toEqual(['AAPL', 'TSLA']);
    expect(out[0]!.total).toBe(2);
  });

  it('empty list => []', () => {
    expect(summarizeBySymbol([])).toEqual([]);
  });
});
