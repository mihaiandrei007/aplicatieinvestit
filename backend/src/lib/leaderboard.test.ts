import { describe, it, expect } from 'vitest';
import { computeRoi, rankByRoi, type Participant } from './leaderboard.js';

describe('computeRoi', () => {
  it('computes the return correctly', () => {
    expect(computeRoi(100000, 112000)).toBeCloseTo(0.12);
    expect(computeRoi(100000, 90000)).toBeCloseTo(-0.1);
    expect(computeRoi(100000, 100000)).toBe(0);
  });

  it('throws on non-positive starting capital', () => {
    expect(() => computeRoi(0, 100)).toThrow();
    expect(() => computeRoi(-1, 100)).toThrow();
  });
});

describe('rankByRoi', () => {
  const participants: Participant[] = [
    { userId: 'u1', displayName: 'Ana', startingCash: 100000, equity: 110000 },
    { userId: 'u2', displayName: 'Bogdan', startingCash: 100000, equity: 130000 },
    { userId: 'u3', displayName: 'Cristi', startingCash: 100000, equity: 95000 },
  ];

  it('orders descending by ROI', () => {
    const ranked = rankByRoi(participants);
    expect(ranked.map((r) => r.userId)).toEqual(['u2', 'u1', 'u3']);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('assigns the same rank for equal ROI and skips over occupied ranks', () => {
    const tie: Participant[] = [
      { userId: 'a', displayName: 'Ana', startingCash: 100000, equity: 120000 },
      { userId: 'b', displayName: 'Bogdan', startingCash: 100000, equity: 120000 },
      { userId: 'c', displayName: 'Cristi', startingCash: 100000, equity: 100000 },
    ];
    const ranked = rankByRoi(tie);
    expect(ranked.map((r) => r.rank)).toEqual([1, 1, 3]);
    // ties are ordered alphabetically for display
    expect(ranked.slice(0, 2).map((r) => r.displayName)).toEqual(['Ana', 'Bogdan']);
  });

  it('handles different starting capital per participant', () => {
    const mixed: Participant[] = [
      { userId: 'x', displayName: 'X', startingCash: 50000, equity: 60000 }, // +20%
      { userId: 'y', displayName: 'Y', startingCash: 100000, equity: 115000 }, // +15%
    ];
    expect(rankByRoi(mixed).map((r) => r.userId)).toEqual(['x', 'y']);
  });

  it('returns an empty list for zero participants', () => {
    expect(rankByRoi([])).toEqual([]);
  });
});
