import { describe, it, expect } from 'vitest';
import { applyCheckIn, daysBetween, checkInCredits, type StreakState } from './streak.js';

const fresh: StreakState = { currentStreak: 0, longestStreak: 0, lastCheckIn: null, freezes: 0 };

describe('daysBetween', () => {
  it('computes the difference in days', () => {
    expect(daysBetween('2026-06-01', '2026-06-02')).toBe(1);
    expect(daysBetween('2026-06-01', '2026-06-08')).toBe(7);
    expect(daysBetween('2026-06-02', '2026-06-01')).toBe(-1);
  });

  it('crosses months', () => {
    expect(daysBetween('2026-06-30', '2026-07-01')).toBe(1);
  });
});

describe('applyCheckIn', () => {
  it('first check-in starts the streak at 1', () => {
    const r = applyCheckIn(fresh, '2026-06-01');
    expect(r.state.currentStreak).toBe(1);
    expect(r.state.lastCheckIn).toBe('2026-06-01');
    expect(r.alreadyCheckedIn).toBe(false);
  });

  it('consecutive days increase the streak', () => {
    let s = applyCheckIn(fresh, '2026-06-01').state;
    s = applyCheckIn(s, '2026-06-02').state;
    s = applyCheckIn(s, '2026-06-03').state;
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it('a second check-in on the same day has no effect', () => {
    const s = applyCheckIn(fresh, '2026-06-01').state;
    const r = applyCheckIn(s, '2026-06-01');
    expect(r.alreadyCheckedIn).toBe(true);
    expect(r.state.currentStreak).toBe(1);
  });

  it('a missed day without a freeze resets the streak', () => {
    let s = { currentStreak: 5, longestStreak: 5, lastCheckIn: '2026-06-01', freezes: 0 };
    const r = applyCheckIn(s, '2026-06-03'); // skipped 2026-06-02
    expect(r.streakReset).toBe(true);
    expect(r.state.currentStreak).toBe(1);
    expect(r.state.longestStreak).toBe(5); // the record stays
  });

  it('a freeze covers a missed day and keeps the streak', () => {
    const s = { currentStreak: 5, longestStreak: 5, lastCheckIn: '2026-06-01', freezes: 1 };
    const r = applyCheckIn(s, '2026-06-03');
    expect(r.usedFreeze).toBe(true);
    expect(r.streakReset).toBe(false);
    expect(r.state.currentStreak).toBe(6);
    expect(r.state.freezes).toBe(0);
  });

  it('earns a freeze when reaching 7 days', () => {
    let s: StreakState = { currentStreak: 6, longestStreak: 6, lastCheckIn: '2026-06-06', freezes: 0 };
    const r = applyCheckIn(s, '2026-06-07');
    expect(r.state.currentStreak).toBe(7);
    expect(r.earnedFreeze).toBe(true);
    expect(r.state.freezes).toBe(1);
  });

  it('does not earn a freeze on reset', () => {
    const s = { currentStreak: 20, longestStreak: 20, lastCheckIn: '2026-06-01', freezes: 0 };
    const r = applyCheckIn(s, '2026-06-10'); // big gap, no freeze -> reset
    expect(r.streakReset).toBe(true);
    expect(r.earnedFreeze).toBe(false);
  });
});

describe('checkInCredits', () => {
  it('base credits + increasing bonus', () => {
    expect(checkInCredits(1)).toBe(5);
    expect(checkInCredits(3)).toBe(6);
    expect(checkInCredits(30)).toBe(10); // bonus capped at +5
  });
});
