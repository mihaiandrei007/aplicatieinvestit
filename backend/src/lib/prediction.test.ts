import { describe, it, expect } from 'vitest';
import { isDirection, validateStake, predictionWon, payout, MIN_STAKE, MAX_STAKE } from './prediction.js';

describe('isDirection', () => {
  it('accepts only UP/DOWN', () => {
    expect(isDirection('UP')).toBe(true);
    expect(isDirection('DOWN')).toBe(true);
    expect(isDirection('SIDE')).toBe(false);
  });
});

describe('validateStake', () => {
  it('accepts a valid stake', () => {
    expect(() => validateStake(100, 1000)).not.toThrow();
  });
  it('rejects below the minimum', () => {
    expect(() => validateStake(MIN_STAKE - 1, 1000)).toThrow(/minimum/);
  });
  it('rejects above the maximum', () => {
    expect(() => validateStake(MAX_STAKE + 1, 999999)).toThrow(/maximum/);
  });
  it('rejects if it exceeds the cash', () => {
    expect(() => validateStake(500, 100)).toThrow(/cash/);
  });
});

describe('predictionWon', () => {
  it('UP wins when the price rises', () => {
    expect(predictionWon('UP', 100, 105)).toBe(true);
    expect(predictionWon('UP', 100, 95)).toBe(false);
  });
  it('DOWN wins when the price falls', () => {
    expect(predictionWon('DOWN', 100, 95)).toBe(true);
    expect(predictionWon('DOWN', 100, 105)).toBe(false);
  });
  it('no movement = loss', () => {
    expect(predictionWon('UP', 100, 100)).toBe(false);
    expect(predictionWon('DOWN', 100, 100)).toBe(false);
  });
});

describe('payout', () => {
  it('pays stake × multiplier on a win', () => {
    expect(payout(true, 100, 1.9)).toBe(190);
  });
  it('0 on a loss', () => {
    expect(payout(false, 100, 1.9)).toBe(0);
  });
  it('net positive win but below double (the house edge)', () => {
    const net = payout(true, 100, 1.9) - 100;
    expect(net).toBe(90);
    expect(payout(true, 100, 1.9)).toBeLessThan(200);
  });
});
