import { describe, it, expect } from 'vitest';
import { hashString, pickChallengeSymbol, challengeWentUp } from './daily.js';

const symbols = ['AAPL', 'NVDA', 'TSLA', 'KO', 'JPM'];

describe('hashString', () => {
  it('e determinist și nenegativ', () => {
    expect(hashString('2026-06-27')).toBe(hashString('2026-06-27'));
    expect(hashString('x')).toBeGreaterThanOrEqual(0);
  });
  it('strings diferite => hash-uri (de regulă) diferite', () => {
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});

describe('pickChallengeSymbol', () => {
  it('e determinist pentru aceeași dată', () => {
    expect(pickChallengeSymbol('2026-06-27', symbols)).toBe(pickChallengeSymbol('2026-06-27', symbols));
  });
  it('alege un simbol din listă', () => {
    expect(symbols).toContain(pickChallengeSymbol('2026-06-27', symbols));
  });
  it('nu depinde de ordinea inițială a listei', () => {
    expect(pickChallengeSymbol('2026-06-27', symbols)).toBe(
      pickChallengeSymbol('2026-06-27', [...symbols].reverse()),
    );
  });
  it('listă goală => null', () => {
    expect(pickChallengeSymbol('2026-06-27', [])).toBeNull();
  });
});

describe('challengeWentUp', () => {
  it('compară prețurile', () => {
    expect(challengeWentUp(100, 105)).toBe(true);
    expect(challengeWentUp(100, 95)).toBe(false);
    expect(challengeWentUp(100, 100)).toBe(false);
  });
});
