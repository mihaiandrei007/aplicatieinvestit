import { describe, it, expect } from 'vitest';
import { isDirection, validateStake, predictionWon, payout, MIN_STAKE, MAX_STAKE } from './prediction.js';

describe('isDirection', () => {
  it('acceptă doar UP/DOWN', () => {
    expect(isDirection('UP')).toBe(true);
    expect(isDirection('DOWN')).toBe(true);
    expect(isDirection('SIDE')).toBe(false);
  });
});

describe('validateStake', () => {
  it('acceptă o miză validă', () => {
    expect(() => validateStake(100, 1000)).not.toThrow();
  });
  it('respinge sub minim', () => {
    expect(() => validateStake(MIN_STAKE - 1, 1000)).toThrow(/minimă/);
  });
  it('respinge peste maxim', () => {
    expect(() => validateStake(MAX_STAKE + 1, 999999)).toThrow(/maximă/);
  });
  it('respinge dacă depășește numerarul', () => {
    expect(() => validateStake(500, 100)).toThrow(/numerar/);
  });
});

describe('predictionWon', () => {
  it('UP câștigă când prețul crește', () => {
    expect(predictionWon('UP', 100, 105)).toBe(true);
    expect(predictionWon('UP', 100, 95)).toBe(false);
  });
  it('DOWN câștigă când prețul scade', () => {
    expect(predictionWon('DOWN', 100, 95)).toBe(true);
    expect(predictionWon('DOWN', 100, 105)).toBe(false);
  });
  it('fără mișcare = pierdere', () => {
    expect(predictionWon('UP', 100, 100)).toBe(false);
    expect(predictionWon('DOWN', 100, 100)).toBe(false);
  });
});

describe('payout', () => {
  it('plătește miza × multiplicator la câștig', () => {
    expect(payout(true, 100, 1.9)).toBe(190);
  });
  it('0 la pierdere', () => {
    expect(payout(false, 100, 1.9)).toBe(0);
  });
  it('câștig net pozitiv dar sub dublu (avantajul casei)', () => {
    const net = payout(true, 100, 1.9) - 100;
    expect(net).toBe(90);
    expect(payout(true, 100, 1.9)).toBeLessThan(200);
  });
});
