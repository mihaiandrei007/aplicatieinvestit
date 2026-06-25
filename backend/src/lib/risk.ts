/**
 * lib/risk — randament ajustat la risc (Sharpe) și statistici de bază.
 *
 * Funcții pure peste o serie de valori de capital (equity) sau de randamente.
 * Folosite la clasamentul „pe risc", nu doar pe randament brut (Etapa 4) și
 * la scorul de risc educativ (Etapa 5).
 */

/** Randamente simple între valori consecutive: r_t = (v_t - v_{t-1}) / v_{t-1}. */
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

/** Deviație standard a populației (împarte la N). */
export function stdDev(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  const variance = xs.reduce((s, x) => s + (x - m) ** 2, 0) / xs.length;
  return Math.sqrt(variance);
}

/**
 * Sharpe ratio = (randament mediu - rată fără risc) / deviație standard.
 * Întoarce 0 dacă volatilitatea e nulă (nu există risc măsurat) sau prea puține date.
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
  /** Serie de valori de capital în timp (cronologic). */
  equitySeries: readonly number[];
}

export interface SharpeRankEntry {
  userId: string;
  displayName: string;
  sharpe: number;
  rank: number;
}

/** O poziție din portofoliu, pentru scorul de risc. */
export interface RiskPosition {
  /** Ponderea poziției în portofoliu (0..1). */
  weight: number;
  /** Volatilitatea instrumentului (ex. 0.3). */
  volatility: number;
}

/** Indicele Herfindahl-Hirschman al concentrării (0 = diversificat, 1 = totul într-unul). */
export function herfindahl(weights: readonly number[]): number {
  return weights.reduce((s, w) => s + w * w, 0);
}

/**
 * Scor de risc educativ 0–100: combină volatilitatea ponderată a portofoliului
 * cu concentrarea (Herfindahl). Mai mare = mai riscant. Util pentru tooltips/educație.
 */
export function portfolioRiskScore(positions: readonly RiskPosition[]): number {
  if (positions.length === 0) return 0;
  const weightedVol = positions.reduce((s, p) => s + p.weight * p.volatility, 0);
  const concentration = herfindahl(positions.map((p) => p.weight));
  // 70% volatilitate (normalizată la ~0.6 vol = max), 30% concentrare.
  const volComponent = Math.min(1, weightedVol / 0.6);
  const raw = 0.7 * volComponent + 0.3 * concentration;
  return Math.round(Math.min(100, raw * 100));
}

/** Clasament pe Sharpe (descrescător), cu ranguri egale la egalitate. */
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
