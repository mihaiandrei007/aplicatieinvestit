import { describe, it, expect } from 'vitest';
import { netNotionalBySymbol, priceImpact, applyMove, type Flow } from './priceImpact.js';

describe('netNotionalBySymbol', () => {
  it('însumează BUY pozitiv și SELL negativ pe simbol', () => {
    const flows: Flow[] = [
      { symbol: 'AAPL', side: 'BUY', quantity: 10, price: 100 },
      { symbol: 'AAPL', side: 'SELL', quantity: 4, price: 100 },
      { symbol: 'TSLA', side: 'BUY', quantity: 2, price: 200 },
    ];
    expect(netNotionalBySymbol(flows)).toEqual({ AAPL: 600, TSLA: 400 });
  });

  it('listă goală => {}', () => {
    expect(netNotionalBySymbol([])).toEqual({});
  });
});

describe('priceImpact', () => {
  it('cumpărare netă => impact pozitiv', () => {
    expect(priceImpact(50_000, 500_000)).toBeCloseTo(0.1);
  });

  it('vânzare netă => impact negativ', () => {
    expect(priceImpact(-50_000, 500_000)).toBeCloseTo(-0.1);
  });

  it('e limitat la ±maxMove', () => {
    expect(priceImpact(10_000_000, 500_000, 1, 0.12)).toBe(0.12);
    expect(priceImpact(-10_000_000, 500_000, 1, 0.12)).toBe(-0.12);
  });

  it('flux net zero => fără impact', () => {
    expect(priceImpact(0, 500_000)).toBe(0);
  });

  it('lichiditate invalidă => 0', () => {
    expect(priceImpact(50_000, 0)).toBe(0);
  });

  it('lichiditate mai mare => impact mai mic', () => {
    expect(priceImpact(50_000, 1_000_000)).toBeLessThan(priceImpact(50_000, 200_000));
  });
});

describe('applyMove', () => {
  it('aplică o creștere', () => {
    expect(applyMove(100, 0.1)).toBe(110);
  });
  it('aplică o scădere', () => {
    expect(applyMove(100, -0.05)).toBe(95);
  });
  it('prețul rămâne pozitiv', () => {
    expect(applyMove(0.5, -2)).toBeGreaterThan(0);
  });
});
