/**
 * lib/streak — streak de check-in zilnic + „streak freeze" (inspirat din Duolingo).
 *
 * Logică PURĂ pe date `YYYY-MM-DD`: `today` se pasează ca parametru, deci
 * funcția e deterministă și testabilă. Un freeze acoperă o zi pierdută și
 * păstrează streak-ul; freeze-uri se câștigă la fiecare 7 zile de streak.
 */

/** O zi câștigă un freeze la fiecare atâtea zile de streak. */
export const FREEZE_EVERY = 7;
/** Plafon de freeze-uri acumulate. */
export const MAX_FREEZES = 3;
/** Credite de bază la check-in + un mic bonus care crește cu streak-ul. */
export const CHECKIN_BASE_CREDITS = 5;

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** Ultima zi de check-in (YYYY-MM-DD) sau null dacă niciodată. */
  lastCheckIn: string | null;
  freezes: number;
}

export interface CheckInResult {
  state: StreakState;
  /** True dacă utilizatorul a făcut deja check-in azi (fără efect/recompensă). */
  alreadyCheckedIn: boolean;
  usedFreeze: boolean;
  streakReset: boolean;
  earnedFreeze: boolean;
}

/** Transformă o dată YYYY-MM-DD într-un număr de zile (UTC). */
function toDayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Dată invalidă: ${date}`);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** Numărul de zile de la `a` la `b` (poate fi negativ). */
export function daysBetween(a: string, b: string): number {
  return toDayNumber(b) - toDayNumber(a);
}

/**
 * Aplică un check-in pentru ziua `today`. Întoarce noua stare și ce s-a întâmplat.
 * Idempotent: dacă s-a făcut deja check-in azi, nu schimbă nimic.
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
      // Ceas în urmă / dată anterioară — tratează ca deja făcut, fără efect.
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

  // Câștigă un freeze când treci de un nou multiplu de FREEZE_EVERY.
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

/** Creditele de tranzacționare acordate la un check-in, în funcție de streak. */
export function checkInCredits(streak: number): number {
  return CHECKIN_BASE_CREDITS + Math.min(5, Math.floor(streak / 3));
}
