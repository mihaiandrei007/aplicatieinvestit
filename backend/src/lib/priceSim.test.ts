import { describe, it, expect } from 'vitest';
import { simulatePrices, makeRng, nextPrice } from './priceSim.js';

describe('makeRng', () => {
  it('is deterministic for the same seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produces values in [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds give different sequences', () => {
    expect(makeRng(1)()).not.toEqual(makeRng(2)());
  });
});

describe('simulatePrices', () => {
  const params = { basePrice: 100, volatility: 0.2, drift: 0.05, steps: 50 };

  it('is deterministic: same seed => same series', () => {
    expect(simulatePrices(params, 123)).toEqual(simulatePrices(params, 123));
  });

  it('different seeds => different series', () => {
    expect(simulatePrices(params, 1)).not.toEqual(simulatePrices(params, 2));
  });

  it('returns steps + 1 prices, starting with basePrice', () => {
    const series = simulatePrices(params, 9);
    expect(series).toHaveLength(51);
    expect(series[0]).toBe(100);
  });

  it('all prices stay strictly positive', () => {
    const series = simulatePrices({ ...params, steps: 500, volatility: 0.8 }, 99);
    expect(series.every((p) => p > 0)).toBe(true);
  });

  it('steps = 0 returns only the initial price', () => {
    expect(simulatePrices({ ...params, steps: 0 }, 5)).toEqual([100]);
  });

  it('throws on non-positive basePrice', () => {
    expect(() => simulatePrices({ ...params, basePrice: 0 }, 1)).toThrow();
  });

  it('throws on negative or non-integer steps', () => {
    expect(() => simulatePrices({ ...params, steps: -1 }, 1)).toThrow();
    expect(() => simulatePrices({ ...params, steps: 1.5 }, 1)).toThrow();
  });

  it('jumps are deterministic too', () => {
    const jumpy = { ...params, jumpProbability: 0.3, jumpSize: 0.1 };
    expect(simulatePrices(jumpy, 77)).toEqual(simulatePrices(jumpy, 77));
  });
});

describe('nextPrice', () => {
  it('is deterministic for the same parameters and seed', () => {
    const p = { volatility: 0.2, drift: 0.05 };
    expect(nextPrice(100, p, 3)).toEqual(nextPrice(100, p, 3));
  });
});
