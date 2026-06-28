/**
 * lib/streak — daily check-in streak + "streak freeze" (inspired by Duolingo).
 *
 * PURE logic over `YYYY-MM-DD` dates: `today` is passed as a parameter, so the
 * function is deterministic and testable. A freeze covers a missed day and
 * preserves the streak; freezes are earned every 7 days of streak.
 */

/** A freeze is earned every this many days of streak. */
export const FREEZE_EVERY = 7;
/** Cap on accumulated freezes. */
export const MAX_FREEZES = 3;
/** Base credits at check-in + a small bonus that grows with the streak. */
export const CHECKIN_BASE_CREDITS = 5;

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** The last check-in day (YYYY-MM-DD) or null if never. */
  lastCheckIn: string | null;
  freezes: number;
}

export interface CheckInResult {
  state: StreakState;
  /** True if the user has already checked in today (no effect/reward). */
  alreadyCheckedIn: boolean;
  usedFreeze: boolean;
  streakReset: boolean;
  earnedFreeze: boolean;
}

/** Converts a YYYY-MM-DD date into a day number (UTC). */
function toDayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Invalid date: ${date}`);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** The number of days from `a` to `b` (can be negative). */
export function daysBetween(a: string, b: string): number {
  return toDayNumber(b) - toDayNumber(a);
}

/**
 * Applies a check-in for the day `today`. Returns the new state and what happened.
 * Idempotent: if a check-in was already done today, nothing changes.
 */
export function applyCheckIn(state: StreakState, today: string): CheckInResult {
  if (state.lastCheckIn === today) {
    return { state, alreadyCheckedIn: true, usedFreeze: false, streakReset: false, earnedFreeze: false };
  }

  let { currentStreak, freezes } = state;
  const previousStreak = currentStreak;
  let usedFreeze = false;
  let streakReset = false;

  if (state.lastCheckIn === null) {
    currentStreak = 1;
  } else {
    const gap = daysBetween(state.lastCheckIn, today);
    if (gap <= 0) {
      // Clock behind / earlier date — treat as already done, no effect.
      return { state, alreadyCheckedIn: true, usedFreeze: false, streakReset: false, earnedFreeze: false };
    }
    if (gap === 1) {
      currentStreak += 1;
    } else {
      const missed = gap - 1;
      if (freezes >= missed) {
        freezes -= missed;
        usedFreeze = true;
        currentStreak += 1;
      } else {
        currentStreak = 1;
        streakReset = true;
      }
    }
  }

  // Earn a freeze when you cross a new multiple of FREEZE_EVERY.
  let earnedFreeze = false;
  if (
    Math.floor(currentStreak / FREEZE_EVERY) > Math.floor(previousStreak / FREEZE_EVERY) &&
    freezes < MAX_FREEZES
  ) {
    freezes += 1;
    earnedFreeze = true;
  }

  const longestStreak = Math.max(state.longestStreak, currentStreak);
  return {
    state: { currentStreak, longestStreak, lastCheckIn: today, freezes },
    alreadyCheckedIn: false,
    usedFreeze,
    streakReset,
    earnedFreeze,
  };
}

/** The trade credits granted at a check-in, depending on the streak. */
export function checkInCredits(streak: number): number {
  return CHECKIN_BASE_CREDITS + Math.min(5, Math.floor(streak / 3));
}
