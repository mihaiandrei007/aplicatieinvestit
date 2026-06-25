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
  it('calculează randamente simple', () => {
    expect(returnsFromSeries([100, 110, 99])).toEqual([0.1, expect.closeTo(-0.1)]);
  });

  it('serie cu un singur element => fără randamente', () => {
    expect(returnsFromSeries([100])).toEqual([]);
  });
});

describe('statistici', () => {
  it('mean și stdDev', () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(stdDev([2, 4, 6])).toBeCloseTo(Math.sqrt(8 / 3));
  });

  it('serie goală => 0', () => {
    expect(mean([])).toBe(0);
    expect(stdDev([])).toBe(0);
  });
});

describe('sharpeRatio', () => {
  it('e 0 când volatilitatea e nulă', () => {
    expect(sharpeRatio([0.01, 0.01, 0.01])).toBe(0);
  });

  it('e pozitiv pentru randamente pozitive cu variație', () => {
    expect(sharpeRatio([0.02, 0.01, 0.03])).toBeGreaterThan(0);
  });

  it('e negativ pentru randamente predominant negative', () => {
    expect(sharpeRatio([-0.02, -0.01, -0.03])).toBeLessThan(0);
  });

  it('prea puține date => 0', () => {
    expect(sharpeRatio([0.05])).toBe(0);
  });
});

describe('rankBySharpe', () => {
  it('ordonează după Sharpe descrescător', () => {
    const participants: SharpeParticipant[] = [
      { userId: 'risky', displayName: 'Risky', equitySeries: [100, 130, 90, 140] },
      { userId: 'steady', displayName: 'Steady', equitySeries: [100, 102, 104, 106] },
    ];
    const ranked = rankBySharpe(participants);
    // Steady are randament constant -> Sharpe mai mare decât cel volatil
    expect(ranked[0]!.userId).toBe('steady');
    expect(ranked.map((r) => r.rank)).toEqual([1, 2]);
  });

  it('listă goală => []', () => {
    expect(rankBySharpe([])).toEqual([]);
  });
});

describe('scor de risc', () => {
  it('herfindahl: diversificat < concentrat', () => {
    expect(herfindahl([0.5, 0.5])).toBeCloseTo(0.5);
    expect(herfindahl([1])).toBeCloseTo(1);
    expect(herfindahl([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(0.25);
  });

  it('portofoliu gol => 0', () => {
    expect(portfolioRiskScore([])).toBe(0);
  });

  it('un singur instrument volatil e mai riscant decât unul diversificat și calm', () => {
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
