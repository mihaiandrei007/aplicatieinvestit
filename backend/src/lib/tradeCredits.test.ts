import { describe, it, expect } from 'vitest';
import { canTrade, spendCredit, grantCredits, DEFAULT_MAX } from './tradeCredits.js';

describe('canTrade', () => {
  it('necesită cel puțin un credit', () => {
    expect(canTrade(1)).toBe(true);
    expect(canTrade(0)).toBe(false);
    expect(canTrade(-1)).toBe(false);
  });
});

describe('spendCredit', () => {
  it('scade un credit', () => {
    expect(spendCredit(5)).toBe(4);
  });
  it('aruncă la zero credite', () => {
    expect(() => spendCredit(0)).toThrow(/credite/);
  });
});

describe('grantCredits', () => {
  it('adaugă credite', () => {
    expect(grantCredits(10, 5)).toBe(15);
  });
  it('respectă plafonul', () => {
    expect(grantCredits(28, 5, DEFAULT_MAX)).toBe(DEFAULT_MAX);
    expect(grantCredits(30, 5, 30)).toBe(30);
  });
  it('ignoră sume negative', () => {
    expect(grantCredits(10, -5)).toBe(10);
  });
});
