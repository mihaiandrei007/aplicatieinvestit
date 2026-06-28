import { describe, it, expect } from 'vitest';
import {
  tradesRemaining,
  wouldExceedDailyLimit,
  evaluateBadges,
  newlyEarnedBadges,
  type UserStats,
} from './gamification.js';

describe('anti-overtrading', () => {
  it('tradesRemaining decreases with the number of trades', () => {
    expect(tradesRemaining(0, 20)).toBe(20);
    expect(tradesRemaining(18, 20)).toBe(2);
    expect(tradesRemaining(25, 20)).toBe(0);
  });

  it('wouldExceedDailyLimit when the limit is reached', () => {
    expect(wouldExceedDailyLimit(19, 20)).toBe(false);
    expect(wouldExceedDailyLimit(20, 20)).toBe(true);
  });
});

describe('badges', () => {
  const base: UserStats = { tradeCount: 0, distinctSymbols: 0, roi: 0, realizedPnL: 0, inGroup: false };

  it('no trade => no badge', () => {
    expect(evaluateBadges(base)).toEqual([]);
  });

  it('first trade unlocks FIRST_TRADE', () => {
    expect(evaluateBadges({ ...base, tradeCount: 1 })).toContain('FIRST_TRADE');
  });

  it('diversification and return', () => {
    const stats: UserStats = { tradeCount: 6, distinctSymbols: 5, roi: 0.12, realizedPnL: 500, inGroup: true };
    const earned = evaluateBadges(stats);
    expect(earned).toEqual(
      expect.arrayContaining(['FIRST_TRADE', 'DIVERSIFIED', 'IN_THE_GREEN', 'TEN_PERCENT', 'PROFIT_TAKER', 'TEAM_PLAYER']),
    );
  });

  it('newlyEarnedBadges excludes badges already held', () => {
    const stats: UserStats = { ...base, tradeCount: 1, roi: 0.05 };
    expect(newlyEarnedBadges(stats, ['FIRST_TRADE'])).toEqual(['IN_THE_GREEN']);
  });
});
