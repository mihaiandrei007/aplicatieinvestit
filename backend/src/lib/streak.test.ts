import { describe, it, expect } from 'vitest';
import { applyCheckIn, daysBetween, checkInCredits, type StreakState } from './streak.js';

const fresh: StreakState = { currentStreak: 0, longestStreak: 0, lastCheckIn: null, freezes: 0 };

describe('daysBetween', () => {
  it('calculează diferența de zile', () => {
    expect(daysBetween('2026-06-01', '2026-06-02')).toBe(1);
    expect(daysBetween('2026-06-01', '2026-06-08')).toBe(7);
    expect(daysBetween('2026-06-02', '2026-06-01')).toBe(-1);
  });

  it('traversează luni', () => {
    expect(daysBetween('2026-06-30', '2026-07-01')).toBe(1);
  });
});

describe('applyCheckIn', () => {
  it('primul check-in pornește streak-ul la 1', () => {
    const r = applyCheckIn(fresh, '2026-06-01');
    expect(r.state.currentStreak).toBe(1);
    expect(r.state.lastCheckIn).toBe('2026-06-01');
    expect(r.alreadyCheckedIn).toBe(false);
  });

  it('zile consecutive cresc streak-ul', () => {
    let s = applyCheckIn(fresh, '2026-06-01').state;
    s = applyCheckIn(s, '2026-06-02').state;
    s = applyCheckIn(s, '2026-06-03').state;
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it('al doilea check-in în aceeași zi nu are efect', () => {
    const s = applyCheckIn(fresh, '2026-06-01').state;
    const r = applyCheckIn(s, '2026-06-01');
    expect(r.alreadyCheckedIn).toBe(true);
    expect(r.state.currentStreak).toBe(1);
  });

  it('o zi pierdută fără freeze resetează streak-ul', () => {
    let s = { currentStreak: 5, longestStreak: 5, lastCheckIn: '2026-06-01', freezes: 0 };
    const r = applyCheckIn(s, '2026-06-03'); // a sărit 2026-06-02
    expect(r.streakReset).toBe(true);
    expect(r.state.currentStreak).toBe(1);
    expect(r.state.longestStreak).toBe(5); // recordul rămâne
  });

  it('un freeze acoperă o zi pierdută și păstrează streak-ul', () => {
    const s = { currentStreak: 5, longestStreak: 5, lastCheckIn: '2026-06-01', freezes: 1 };
    const r = applyCheckIn(s, '2026-06-03');
    expect(r.usedFreeze).toBe(true);
    expect(r.streakReset).toBe(false);
    expect(r.state.currentStreak).toBe(6);
    expect(r.state.freezes).toBe(0);
  });

  it('câștigă un freeze la atingerea a 7 zile', () => {
    let s: StreakState = { currentStreak: 6, longestStreak: 6, lastCheckIn: '2026-06-06', freezes: 0 };
    const r = applyCheckIn(s, '2026-06-07');
    expect(r.state.currentStreak).toBe(7);
    expect(r.earnedFreeze).toBe(true);
    expect(r.state.freezes).toBe(1);
  });

  it('nu câștigă freeze la resetare', () => {
    const s = { currentStreak: 20, longestStreak: 20, lastCheckIn: '2026-06-01', freezes: 0 };
    const r = applyCheckIn(s, '2026-06-10'); // gap mare, fără freeze -> reset
    expect(r.streakReset).toBe(true);
    expect(r.earnedFreeze).toBe(false);
  });
});

describe('checkInCredits', () => {
  it('credite de bază + bonus crescător', () => {
    expect(checkInCredits(1)).toBe(5);
    expect(checkInCredits(3)).toBe(6);
    expect(checkInCredits(30)).toBe(10); // bonus plafonat la +5
  });
});
