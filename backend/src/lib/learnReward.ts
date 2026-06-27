/**
 * lib/learnReward — recompensă pentru promovarea unui quiz (inspirat din
 * „Learn & Earn" de la Robinhood, dar cu recompense VIRTUALE: cash virtual +
 * credite de tranzacționare, nu bani reali — rămânem educativi).
 *
 * Funcții pure, testate. Acordarea efectivă (o singură dată per quiz) o face ruta.
 */

/** Prag de promovare: cel puțin 70% corect. */
export const PASS_RATIO = 0.7;

export interface LearnReward {
  /** Cash virtual adăugat în portofoliu. */
  cash: number;
  /** Credite de tranzacționare. */
  credits: number;
}

/** True dacă scorul trece pragul de promovare. */
export function isQuizPass(score: number, total: number): boolean {
  return total > 0 && score / total >= PASS_RATIO;
}

/**
 * Recompensa pentru un quiz promovat. Scor perfect => bonus.
 * Întoarce null dacă quiz-ul nu e promovat.
 */
export function quizReward(
  score: number,
  total: number,
  base: { cash: number; credits: number } = { cash: 500, credits: 2 },
): LearnReward | null {
  if (!isQuizPass(score, total)) return null;
  const perfect = score === total;
  return {
    cash: perfect ? base.cash * 2 : base.cash,
    credits: perfect ? base.credits + 1 : base.credits,
  };
}
