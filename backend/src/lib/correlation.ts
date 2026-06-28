/**
 * lib/correlation — dependencies between stocks (sector co-movement).
 *
 * Each instrument belongs to a sector with a LEADER (e.g. NVDA for AI).
 * A follower's final move = its own move + `correlation` × the leader's move.
 * So when NVDA goes up/down, the AI companies move in the same direction.
 *
 * Pure, tested function.
 */

export interface CorrMember {
  symbol: string;
  sector: string | null;
  /** How closely it follows the leader (0 = leader/independent). */
  correlation: number;
}

export interface CorrelationInput {
  members: readonly CorrMember[];
  /** The "own" (idiosyncratic) return of each symbol for this step. */
  ownReturn: Readonly<Record<string, number>>;
  /** The leader of each sector. */
  leaders: Readonly<Record<string, string>>;
}

/**
 * Applies the correlation overlay: returns the final return per symbol.
 * Leaders and instruments without a sector/correlation keep their own return.
 */
export function applySectorCorrelation(input: CorrelationInput): Record<string, number> {
  const { members, ownReturn, leaders } = input;
  const out: Record<string, number> = {};

  for (const m of members) {
    const own = ownReturn[m.symbol] ?? 0;
    const leaderSym = m.sector ? leaders[m.sector] : undefined;

    if (!m.sector || !leaderSym || leaderSym === m.symbol || m.correlation <= 0) {
      out[m.symbol] = own;
    } else {
      const leaderReturn = ownReturn[leaderSym] ?? 0;
      out[m.symbol] = own + m.correlation * leaderReturn;
    }
  }
  return out;
}
