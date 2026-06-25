import { describe, it, expect } from 'vitest';
import { compoundInterest, futureValueWithContributions, ruleOf72, cagr } from './finance.js';

describe('compoundInterest', () => {
  it('capitalizare anuală simplă', () => {
    expect(compoundInterest(1000, 0.1, 1)).toBeCloseTo(1100);
    expect(compoundInterest(1000, 0.1, 2)).toBeCloseTo(1210);
  });

  it('capitalizare lunară > anuală', () => {
    expect(compoundInterest(1000, 0.12, 1, 12)).toBeGreaterThan(compoundInterest(1000, 0.12, 1, 1));
  });

  it('principal 0 => 0', () => {
    expect(compoundInterest(0, 0.1, 5)).toBe(0);
  });

  it('aruncă la parametri invalizi', () => {
    expect(() => compoundInterest(-100, 0.1, 1)).toThrow();
    expect(() => compoundInterest(100, 0.1, 1, 0)).toThrow();
  });
});

describe('futureValueWithContributions', () => {
  it('adaugă contribuțiile lunare', () => {
    // Fără dobândă: principal + 12 * contribuție
    expect(futureValueWithContributions(1000, 0, 1, 100)).toBeCloseTo(1000 + 1200);
  });

  it('crește cu dobândă pozitivă', () => {
    expect(futureValueWithContributions(1000, 0.06, 1, 100)).toBeGreaterThan(2200);
  });
});

describe('ruleOf72', () => {
  it('estimează anii de dublare', () => {
    expect(ruleOf72(8)).toBe(9);
    expect(ruleOf72(6)).toBe(12);
  });
  it('aruncă la rată nepozitivă', () => {
    expect(() => ruleOf72(0)).toThrow();
  });
});

describe('cagr', () => {
  it('calculează randamentul anualizat', () => {
    expect(cagr(1000, 1000, 5)).toBeCloseTo(0);
    expect(cagr(100, 200, 1)).toBeCloseTo(1);
  });
  it('valori invalide => 0', () => {
    expect(cagr(0, 100, 5)).toBe(0);
  });
});
