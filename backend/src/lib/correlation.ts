/**
 * lib/correlation — dependențe între stocuri (co-mișcare pe sector).
 *
 * Fiecare instrument aparține unui sector cu un LIDER (ex. NVDA pentru AI).
 * Mișcarea finală a unui urmăritor = mișcarea proprie + `correlation` × mișcarea
 * liderului. Astfel, când NVDA urcă/coboară, firmele AI se mișcă în aceeași direcție.
 *
 * Funcție pură, testată.
 */

export interface CorrMember {
  symbol: string;
  sector: string | null;
  /** Cât de mult urmează liderul (0 = lider/independent). */
  correlation: number;
}

export interface CorrelationInput {
  members: readonly CorrMember[];
  /** Randamentul „propriu" (idiosincratic) al fiecărui simbol pentru acest pas. */
  ownReturn: Readonly<Record<string, number>>;
  /** Liderul fiecărui sector. */
  leaders: Readonly<Record<string, string>>;
}

/**
 * Aplică overlay-ul de corelație: întoarce randamentul final per simbol.
 * Liderii și instrumentele fără sector/corelație rămân cu randamentul propriu.
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
