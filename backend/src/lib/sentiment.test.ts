import { describe, it, expect } from 'vitest';
import { summarizeSymbol, summarizeBySymbol, isSentimentValue, type SentimentRow } from './sentiment.js';

describe('isSentimentValue', () => {
  it('acceptă doar BULLISH/BEARISH', () => {
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

  it('numără și calculează procentul bullish', () => {
    expect(summarizeSymbol('AAPL', rows)).toEqual({ symbol: 'AAPL', bullish: 2, bearish: 1, total: 3, bullishPct: 67 });
  });

  it('simbol fără poziții => 0%', () => {
    expect(summarizeSymbol('MSFT', rows)).toEqual({ symbol: 'MSFT', bullish: 0, bearish: 0, total: 0, bullishPct: 0 });
  });
});

describe('summarizeBySymbol', () => {
  const rows: SentimentRow[] = [
    { symbol: 'AAPL', value: 'BULLISH' },
    { symbol: 'AAPL', value: 'BEARISH' },
    { symbol: 'TSLA', value: 'BULLISH' },
  ];

  it('ordonează după interes (total) descrescător', () => {
    const out = summarizeBySymbol(rows);
    expect(out.map((s) => s.symbol)).toEqual(['AAPL', 'TSLA']);
    expect(out[0]!.total).toBe(2);
  });

  it('listă goală => []', () => {
    expect(summarizeBySymbol([])).toEqual([]);
  });
});
