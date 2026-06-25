/**
 * lib/gamification — reguli educative: anti-overtrading + insigne (badges).
 *
 * Pur și testat. Regula anti-overtrading descurajează tranzacționarea excesivă;
 * insignele răsplătesc comportamente sănătoase / repere de învățare.
 */

export const DEFAULT_DAILY_TRADE_LIMIT = 20;

/** Câte tranzacții mai are voie azi un utilizator. */
export function tradesRemaining(tradesToday: number, limit = DEFAULT_DAILY_TRADE_LIMIT): number {
  return Math.max(0, limit - tradesToday);
}

/** True dacă o nouă tranzacție ar depăși limita zilnică. */
export function wouldExceedDailyLimit(tradesToday: number, limit = DEFAULT_DAILY_TRADE_LIMIT): boolean {
  return tradesToday >= limit;
}

/** Statistici agregate ale unui utilizator, intrare pentru evaluarea insignelor. */
export interface UserStats {
  tradeCount: number;
  distinctSymbols: number;
  roi: number;
  realizedPnL: number;
  /** Are cont într-un grup (a socializat). */
  inGroup: boolean;
}

export interface BadgeDef {
  code: string;
  label: string;
  description: string;
  earned: (s: UserStats) => boolean;
}

/** Catalogul de insigne. Predicate pure peste UserStats. */
export const BADGES: readonly BadgeDef[] = [
  {
    code: 'FIRST_TRADE',
    label: 'Primul pas',
    description: 'Ai făcut prima tranzacție.',
    earned: (s) => s.tradeCount >= 1,
  },
  {
    code: 'DIVERSIFIED',
    label: 'Diversificat',
    description: 'Deții/ai tranzacționat cel puțin 5 simboluri diferite.',
    earned: (s) => s.distinctSymbols >= 5,
  },
  {
    code: 'IN_THE_GREEN',
    label: 'Pe plus',
    description: 'Randament pozitiv (ROI > 0).',
    earned: (s) => s.roi > 0,
  },
  {
    code: 'TEN_PERCENT',
    label: 'Două cifre',
    description: 'Ai depășit +10% randament.',
    earned: (s) => s.roi >= 0.1,
  },
  {
    code: 'PROFIT_TAKER',
    label: 'Profit realizat',
    description: 'Ai închis tranzacții cu profit total pozitiv.',
    earned: (s) => s.realizedPnL > 0,
  },
  {
    code: 'TEAM_PLAYER',
    label: 'Spirit de echipă',
    description: 'Ești membru într-un grup.',
    earned: (s) => s.inGroup,
  },
];

/** Codurile insignelor câștigate pe baza statisticilor. */
export function evaluateBadges(stats: UserStats): string[] {
  return BADGES.filter((b) => b.earned(stats)).map((b) => b.code);
}

/** Insignele nou câștigate față de cele deja deținute. */
export function newlyEarnedBadges(stats: UserStats, alreadyHave: readonly string[]): string[] {
  const have = new Set(alreadyHave);
  return evaluateBadges(stats).filter((code) => !have.has(code));
}
