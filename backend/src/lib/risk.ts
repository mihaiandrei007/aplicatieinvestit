/**
 * lib/risk — risk-adjusted return (Sharpe) and basic statistics.
 *
 * Pure functions over a series of equity values or returns.
 * Used for the "risk-adjusted" leaderboard, not just raw return (Stage 4), and
 * for the educational risk score (Stage 5).
 */

/** Simple returns between consecutive values: r_t = (v_t - v_{t-1}) / v_{t-1}. */
export function returnsFromSeries(values: readonly number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1]!;
    if (prev === 0) {
      out.push(0);
    } else {
      out.push((values[i]! - prev) / prev);
    }
  }
  return out;
}

export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

/** Population standard deviation (divides by N). */
export function stdDev(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  const variance = xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
  return Math.sqrt(variance);
}

/**
 * Sharpe ratio = (mean return - risk-free rate) / standard deviation.
 * Returns 0 if volatility is zero (no measured risk) or there is too little data.
 */
export function sharpeRatio(returns: readonly number[], riskFreePerPeriod = 0): number {
  if (returns.length < 2) return 0;
  const excess = returns.map((r) => r - riskFreePerPeriod);
  const sd = stdDev(excess);
  if (sd === 0) return 0;
  return mean(excess) / sd;
}

export interface SharpeParticipant {
  userId: string;
  displayName: string;
  /** Series of equity values over time (chronological). */
  equitySeries: readonly number[];
}

export interface SharpeRankEntry {
  userId: string;
  displayName: string;
  sharpe: number;
  rank: number;
}

/** A portfolio position, for the risk score. */
export interface RiskPosition {
  /** The position's weight in the portfolio (0..1). */
  weight: number;
  /** The instrument's volatility (e.g. 0.3). */
  volatility: number;
}

/** The Herfindahl-Hirschman concentration index (0 = diversified, 1 = all in one). */
export function herfindahl(weights: readonly number[]): number {
  return weights.reduce((s, w) => s + w * w, 0);
}

/**
 * Educational risk score 0–100: combines the portfolio's weighted volatility
 * with concentration (Herfindahl). Higher = riskier. Useful for tooltips/education.
 */
export function portfolioRiskScore(positions: readonly RiskPosition[]): number {
  if (positions.length === 0) return 0;
  const weightedVol = positions.reduce((s, p) => s + p.weight * p.volatility, 0);
  const concentration = herfindahl(positions.map((p) => p.weight));
  // 70% volatility (normalized to ~0.6 vol = max), 30% concentration.
  const volComponent = Math.min(1, weightedVol / 0.6);
  const raw = 0.7 * volComponent + 0.3 * concentration;
  return Math.round(Math.min(100, raw * 100));
}

/** Sharpe leaderboard (descending), with equal ranks on ties. */
export function rankBySharpe(participants: readonly SharpeParticipant[]): SharpeRankEntry[] {
  const scored = participants.map((p) => ({
    userId: p.userId,
    displayName: p.displayName,
    sharpe: sharpeRatio(returnsFromSeries(p.equitySeries)),
  }));

  scored.sort((a, b) => b.sharpe - a.sharpe || a.displayName.localeCompare(b.displayName));

  const ranked: SharpeRankEntry[] = [];
  let prev: number | null = null;
  let rank = 0;
  scored.forEach((entry, i) => {
    if (prev === null || entry.sharpe !== prev) {
      rank = i + 1;
      prev = entry.sharpe;
    }
    ranked.push({ ...entry, rank });
  });
  return ranked;
}
