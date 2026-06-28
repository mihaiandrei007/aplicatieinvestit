import { describe, it, expect } from 'vitest';
import { netNotionalBySymbol, priceImpact, applyMove, type Flow } from './priceImpact.js';

describe('netNotionalBySymbol', () => {
  it('sums BUY as positive and SELL as negative per symbol', () => {
    const flows: Flow[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
      { symbol: 'AAPL', side: 'SELL', quantity: 4, price: 100 },
      { symbol: 'TSLA', side: 'BUY', quantity: 2, price: 200 },
    ];
    expect(netNotionalBySymbol(flows)).toEqual({ AAPL: 600, TSLA: 400 });
  });

  it('empty list => {}', () => {
    expect(netNotionalBySymbol([])).toEqual({});
  });
});

describe('priceImpact', () => {
  it('net buying => positive impact', () => {
    expect(priceImpact(50_000, 500_000)).toBeCloseTo(0.1);
  });

  it('net selling => negative impact', () => {
    expect(priceImpact(-50_000, 500_000)).toBeCloseTo(-0.1);
  });

  it('is clamped to ±maxMove', () => {
    expect(priceImpact(10_000_000, 500_000, 1, 0.12)).toBe(0.12);
    expect(priceImpact(-10_000_000, 500_000, 1, 0.12)).toBe(-0.12);
  });

  it('zero net flow => no impact', () => {
    expect(priceImpact(0, 500_000)).toBe(0);
  });

  it('invalid liquidity => 0', () => {
    expect(priceImpact(50_000, 0)).toBe(0);
  });

  it('higher liquidity => smaller impact', () => {
    expect(priceImpact(50_000, 1_000_000)).toBeLessThan(priceImpact(50_000, 200_000));
  });
});

describe('applyMove', () => {
  it('applies an increase', () => {
    expect(applyMove(100, 0.1)).toBe(110);
  });
  it('applies a decrease', () => {
    expect(applyMove(100, -0.05)).toBe(95);
  });
  it('the price stays positive', () => {
    expect(applyMove(0.5, -2)).toBeGreaterThan(0);
  });
});
