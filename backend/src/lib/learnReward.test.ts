import { describe, it, expect } from 'vitest';
import { isQuizPass, quizReward } from './learnReward.js';

describe('isQuizPass', () => {
  it('promovează la ≥70%', () => {
    expect(isQuizPass(7, 10)).toBe(true);
    expect(isQuizPass(2, 2)).toBe(true);
    expect(isQuizPass(1, 2)).toBe(false);
    expect(isQuizPass(0, 0)).toBe(false);
  });
});

describe('quizReward', () => {
  it('null dacă nu e promovat', () => {
    expect(quizReward(1, 2)).toBeNull();
  });

  it('recompensă standard la promovare parțială', () => {
    expect(quizReward(7, 10)).toEqual({ cash: 500, credits: 2 });
  });

  it('bonus la scor perfect', () => {
    expect(quizReward(2, 2)).toEqual({ cash: 1000, credits: 3 });
  });

  it('respectă recompensa de bază personalizată', () => {
    expect(quizReward(3, 3, { cash: 100, credits: 1 })).toEqual({ cash: 200, credits: 2 });
  });
});
