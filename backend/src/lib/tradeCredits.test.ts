import { describe, it, expect } from 'vitest';
import { canTrade, spendCredit, grantCredits, DEFAULT_MAX } from './tradeCredits.js';

describe('canTrade', () => {
  it('requires at least one credit', () => {
    expect(canTrade(1)).toBe(true);
    expect(canTrade(0)).toBe(false);
    expect(canTrade(-1)).toBe(false);
  });
});

describe('spendCredit', () => {
  it('decreases by one credit', () => {
    expect(spendCredit(5)).toBe(4);
  });
  it('throws at zero credits', () => {
    expect(() => spendCredit(0)).toThrow(/credits/);
  });
});

describe('grantCredits', () => {
  it('adds credits', () => {
    expect(grantCredits(10, 5)).toBe(15);
  });
  it('respects the cap', () => {
    expect(grantCredits(28, 5, DEFAULT_MAX)).toBe(DEFAULT_MAX);
    expect(grantCredits(30, 5, 30)).toBe(30);
  });
  it('ignores negative amounts', () => {
    expect(grantCredits(10, -5)).toBe(10);
  });
});
