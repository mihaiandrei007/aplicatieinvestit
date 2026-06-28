/**
 * lib/gamification — educational rules: anti-overtrading + badges.
 *
 * Pure and tested. The anti-overtrading rule discourages excessive trading;
 * badges reward healthy behaviors / learning milestones.
 */

export const DEFAULT_DAILY_TRADE_LIMIT = 20;

/** How many trades a user is still allowed to make today. */
export function tradesRemaining(tradesToday: number, limit = DEFAULT_DAILY_TRADE_LIMIT): number {
  return Math.max(0, limit - tradesToday);
}

/** True if a new trade would exceed the daily limit. */
export function wouldExceedDailyLimit(tradesToday: number, limit = DEFAULT_DAILY_TRADE_LIMIT): boolean {
  return tradesToday >= limit;
}

/** Aggregated user statistics, the input for badge evaluation. */
export interface UserStats {
  tradeCount: number;
  distinctSymbols: number;
  roi: number;
  realizedPnL: number;
  /** Has an account in a group (has socialized). */
  inGroup: boolean;
}

export interface BadgeDef {
  code: string;
  label: string;
  description: string;
  earned: (s: UserStats) => boolean;
}

/** The badge catalog. Pure predicates over UserStats. */
export const BADGES: readonly BadgeDef[] = [
  {
    code: 'FIRST_TRADE',
    label: 'First step',
    description: 'You made your first trade.',
    earned: (s) => s.tradeCount >= 1,
  },
  {
    code: 'DIVERSIFIED',
    label: 'Diversified',
    description: 'You hold/have traded at least 5 different symbols.',
    earned: (s) => s.distinctSymbols >= 5,
  },
  {
    code: 'IN_THE_GREEN',
    label: 'In the green',
    description: 'Positive return (ROI > 0).',
    earned: (s) => s.roi > 0,
  },
  {
    code: 'TEN_PERCENT',
    label: 'Double digits',
    description: 'You passed +10% return.',
    earned: (s) => s.roi >= 0.1,
  },
  {
    code: 'PROFIT_TAKER',
    label: 'Profit taker',
    description: 'You closed trades with a positive total profit.',
    earned: (s) => s.realizedPnL > 0,
  },
  {
    code: 'TEAM_PLAYER',
    label: 'Team player',
    description: 'You are a member of a group.',
    earned: (s) => s.inGroup,
  },
];

/** The codes of the badges earned based on the statistics. */
export function evaluateBadges(stats: UserStats): string[] {
  return BADGES.filter((b) => b.earned(stats)).map((b) => b.code);
}

/** The newly earned badges compared to those already held. */
export function newlyEarnedBadges(stats: UserStats, alreadyHave: readonly string[]): string[] {
  const have = new Set(alreadyHave);
  return evaluateBadges(stats).filter((code) => !have.has(code));
}
