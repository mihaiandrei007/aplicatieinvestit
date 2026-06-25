import { describe, it, expect } from 'vitest';
import { MISSIONS, QUIZZES, gradeQuiz, nextMission, academyProgress } from './academy.js';

describe('gradeQuiz', () => {
  const quiz = QUIZZES.find((q) => q.id === 'quiz-basics')!;

  it('notează toate răspunsurile corecte', () => {
    const answers = { b1: 1, b2: 1 };
    const r = gradeQuiz(quiz, answers);
    expect(r.score).toBe(2);
    expect(r.total).toBe(2);
    expect(r.results.every((x) => x.correct)).toBe(true);
  });

  it('notează răspunsuri greșite și oferă explicații', () => {
    const r = gradeQuiz(quiz, { b1: 0, b2: 1 });
    expect(r.score).toBe(1);
    expect(r.results[0]!.correct).toBe(false);
    expect(r.results[0]!.explanation).toContain('cotă-parte');
  });

  it('răspuns lipsă => incorect', () => {
    expect(gradeQuiz(quiz, {}).score).toBe(0);
  });
});

describe('nextMission', () => {
  it('prima misiune dacă nimic nu e completat', () => {
    expect(nextMission([])?.id).toBe('basics');
  });

  it('sare peste misiunile completate', () => {
    expect(nextMission(['basics', 'diversify'])?.id).toBe('risk-return');
  });

  it('null când totul e completat', () => {
    expect(nextMission(MISSIONS.map((m) => m.id))).toBeNull();
  });
});

describe('academyProgress', () => {
  it('0% la început, 100% la final', () => {
    expect(academyProgress([])).toBe(0);
    expect(academyProgress(MISSIONS.map((m) => m.id))).toBe(100);
  });

  it('ignoră id-uri necunoscute', () => {
    expect(academyProgress(['basics', 'inexistent'])).toBe(Math.round((1 / MISSIONS.length) * 100));
  });
});
