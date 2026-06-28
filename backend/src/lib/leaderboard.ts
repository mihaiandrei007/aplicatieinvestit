/**
 * lib/leaderboard — group leaderboard by return (ROI).
 *
 * Pure functions: they take each participant's starting capital and current
 * capital (equity) and produce an ordered leaderboard. ROI = (equity - start) / start.
 *
 * Ties get the same rank ("standard competition ranking": 1, 2, 2, 4).
 */

export interface Participant {
  userId: string;
  displayName: string;
  /** Starting capital (strictly positive). */
  startingCash: number;
  /** Total current capital: cash + the market value of the holdings. */
  equity: number;
}

export interface RankedEntry extends Participant {
  /** Return, e.g. 0.12 = +12%. */
  roi: number;
  /** Rank on the leaderboard (1 = best). */
  rank: number;
}

/** ROI for a single participant. */
export function computeRoi(startingCash: number, equity: number): number {
  if (!Number.isFinite(startingCash) || startingCash <= 0) {
    throw new Error(`startingCash must be positive (received: ${startingCash}).`);
  }
  return (equity - startingCash) / startingCash;
}

/**
 * Orders participants in descending order by ROI and assigns ranks.
 * ROI ties are broken stably by displayName (alphabetically) for display,
 * but participants tied on ROI get the same rank.
 */
export function rankByRoi(participants: readonly Participant[]): RankedEntry[] {
  const withRoi = participants.map((p) => ({ ...p, roi: computeRoi(p.startingCash, p.equity) }));

  withRoi.sort((a, b) => {
    if (b.roi !== a.roi) return b.roi - a.roi;
    return a.displayName.localeCompare(b.displayName);
  });

  const ranked: RankedEntry[] = [];
  let previousRoi: number | null = null;
  let currentRank = 0;

  withRoi.forEach((entry, index) => {
    if (previousRoi === null || entry.roi !== previousRoi) {
      currentRank = index + 1; // skips the ranks taken by ties
      previousRoi = entry.roi;
    }
    ranked.push({ ...entry, rank: currentRank });
  });

  return ranked;
}
