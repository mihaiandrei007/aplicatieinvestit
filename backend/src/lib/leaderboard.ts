/**
 * lib/leaderboard — clasament de grup după randament (ROI).
 *
 * Funcții pure: primesc capitalul de start și capitalul curent (equity) al fiecărui
 * participant și produc un clasament ordonat. ROI = (equity - start) / start.
 *
 * Egalitățile primesc același rang („standard competition ranking": 1, 2, 2, 4).
 */

export interface Participant {
  userId: string;
  displayName: string;
  /** Capital de pornire (strict pozitiv). */
  startingCash: number;
  /** Capital curent total: numerar + valoarea de piață a deținerilor. */
  equity: number;
}

export interface RankedEntry extends Participant {
  /** Randament, ex. 0.12 = +12%. */
  roi: number;
  /** Rang în clasament (1 = cel mai bun). */
  rank: number;
}

/** ROI pentru un singur participant. */
export function computeRoi(startingCash: number, equity: number): number {
  if (!Number.isFinite(startingCash) || startingCash <= 0) {
    throw new Error(`startingCash trebuie să fie pozitiv (primit: ${startingCash}).`);
  }
  return (equity - startingCash) / startingCash;
}

/**
 * Ordonează participanții descrescător după ROI și atribuie ranguri.
 * Egalitatea de ROI se sparge stabil după displayName (alfabetic) pentru afișare,
 * dar participanții egali la ROI primesc același rang.
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
      currentRank = index + 1; // sare peste rangurile ocupate de egalități
      previousRoi = entry.roi;
    }
    ranked.push({ ...entry, rank: currentRank });
  });

  return ranked;
}
