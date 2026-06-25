import { describe, it, expect } from 'vitest';
import { simulatePrices, makeRng, nextPrice } from './priceSim.js';

describe('makeRng', () => {
  it('e determinist pentru același seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('produce valori în [0, 1)', () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('seed-uri diferite dau secvențe diferite', () => {
    expect(makeRng(1)()).not.toEqual(makeRng(2)());
  });
});

describe('simulatePrices', () => {
  const params = { basePrice: 100, volatility: 0.2, drift: 0.05, steps: 50 };

  it('este determinist: același seed => aceeași serie', () => {
    expect(simulatePrices(params, 123)).toEqual(simulatePrices(params, 123));
  });

  it('seed-uri diferite => serii diferite', () => {
    expect(simulatePrices(params, 1)).not.toEqual(simulatePrices(params, 2));
  });

  it('întoarce steps + 1 prețuri, începând cu basePrice', () => {
    const series = simulatePrices(params, 9);
    expect(series).toHaveLength(51);
    expect(series[0]).toBe(100);
  });

  it('toate prețurile rămân strict pozitive', () => {
    const series = simulatePrices({ ...params, steps: 500, volatility: 0.8 }, 99);
    expect(series.every((p) => p > 0)).toBe(true);
  });

  it('steps = 0 întoarce doar prețul inițial', () => {
    expect(simulatePrices({ ...params, steps: 0 }, 5)).toEqual([100]);
  });

  it('aruncă la basePrice nepozitiv', () => {
    expect(() => simulatePrices({ ...params, basePrice: 0 }, 1)).toThrow();
  });

  it('aruncă la steps negativ sau nefracționar', () => {
    expect(() => simulatePrices({ ...params, steps: -1 }, 1)).toThrow();
    expect(() => simulatePrices({ ...params, steps: 1.5 }, 1)).toThrow();
  });

  it('salturile sunt și ele deterministe', () => {
    const jumpy = { ...params, jumpProbability: 0.3, jumpSize: 0.1 };
    expect(simulatePrices(jumpy, 77)).toEqual(simulatePrices(jumpy, 77));
  });
});

describe('nextPrice', () => {
  it('e determinist pentru aceiași parametri și seed', () => {
    const p = { volatility: 0.2, drift: 0.05 };
    expect(nextPrice(100, p, 3)).toEqual(nextPrice(100, p, 3));
  });
});
