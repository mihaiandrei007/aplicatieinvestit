import { describe, it, expect } from 'vitest';
import { hashString, pickChallengeSymbol, challengeWentUp } from './daily.js';

const symbols = ['AAPL', 'NVDA', 'TSLA', 'KO', 'JPM'];

describe('hashString', () => {
  it('is deterministic and non-negative', () => {
    expect(hashString('2026-06-27')).toBe(hashString('2026-06-27'));
    expect(hashString('x')).toBeGreaterThanOrEqual(0);
  });
  it('different strings => (usually) different hashes', () => {
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});

describe('pickChallengeSymbol', () => {
  it('is deterministic for the same date', () => {
    expect(pickChallengeSymbol('2026-06-27', symbols)).toBe(pickChallengeSymbol('2026-06-27', symbols));
  });
  it('picks a symbol from the list', () => {
    expect(symbols).toContain(pickChallengeSymbol('2026-06-27', symbols));
  });
  it('does not depend on the initial order of the list', () => {
    expect(pickChallengeSymbol('2026-06-27', symbols)).toBe(
      pickChallengeSymbol('2026-06-27', [...symbols].reverse()),
    );
  });
  it('empty list => null', () => {
    expect(pickChallengeSymbol('2026-06-27', [])).toBeNull();
  });
});

describe('challengeWentUp', () => {
  it('compares the prices', () => {
    expect(challengeWentUp(100, 105)).toBe(true);
    expect(challengeWentUp(100, 95)).toBe(false);
    expect(challengeWentUp(100, 100)).toBe(false);
  });
});
