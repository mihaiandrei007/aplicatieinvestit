import { describe, it, expect } from 'vitest';
import {
  returnsFromSeries,
  mean,
  stdDev,
  sharpeRatio,
  rankBySharpe,
  herfindahl,
  portfolioRiskScore,
  type SharpeParticipant,
} from './risk.js';

describe('returnsFromSeries', () => {
  it('computes simple returns', () => {
    expect(returnsFromSeries([100, 110, 99])).toEqual([0.1, expect.closeTo(-0.1)]);
  });

  it('single-element series => no returns', () => {
    expect(returnsFromSeries([100])).toEqual([]);
  });
});

describe('statistics', () => {
  it('mean and stdDev', () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(stdDev([2, 4, 6])).toBeCloseTo(Math.sqrt(8 / 3));
  });

  it('empty series => 0', () => {
    expect(mean([])).toBe(0);
    expect(stdDev([])).toBe(0);
  });
});

describe('sharpeRatio', () => {
  it('is 0 when volatility is zero', () => {
    expect(sharpeRatio([0.01, 0.01, 0.01])).toBe(0);
  });

  it('is positive for positive returns with variation', () => {
    expect(sharpeRatio([0.02, 0.01, 0.03])).toBeGreaterThan(0);
  });

  it('is negative for predominantly negative returns', () => {
    expect(sharpeRatio([-0.02, -0.01, -0.03])).toBeLessThan(0);
  });

  it('too little data => 0', () => {
    expect(sharpeRatio([0.05])).toBe(0);
  });
});

describe('rankBySharpe', () => {
  it('orders by Sharpe descending', () => {
    const participants: SharpeParticipant[] = [
      { userId: 'risky', displayName: 'Risky', equitySeries: [100, 130, 90, 140] },
      { userId: 'steady', displayName: 'Steady', equitySeries: [100, 102, 104, 106] },
    ];
    const ranked = rankBySharpe(participants);
    // Steady has a constant return -> higher Sharpe than the volatile one
    expect(ranked[0]!.userId).toBe('steady');
    expect(ranked.map((r) => r.rank)).toEqual([1, 2]);
  });

  it('empty list => []', () => {
    expect(rankBySharpe([])).toEqual([]);
  });
});

describe('risk score', () => {
  it('herfindahl: diversified < concentrated', () => {
    expect(herfindahl([0.5, 0.5])).toBeCloseTo(0.5);
    expect(herfindahl([1])).toBeCloseTo(1);
    expect(herfindahl([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(0.25);
  });

  it('empty portfolio => 0', () => {
    expect(portfolioRiskScore([])).toBe(0);
  });

  it('a single volatile instrument is riskier than a diversified and calm one', () => {
    const risky = portfolioRiskScore([{ weight: 1, volatility: 0.6 }]);
    const calm = portfolioRiskScore([
      { weight: 0.5, volatility: 0.15 },
      { weight: 0.5, volatility: 0.15 },
    ]);
    expect(risky).toBeGreaterThan(calm);
    expect(risky).toBeLessThanOrEqual(100);
    expect(calm).toBeGreaterThanOrEqual(0);
  });
});
