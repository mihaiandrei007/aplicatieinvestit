import { describe, it, expect } from 'vitest';
import { normalizeInviteCode, isValidInviteCode, generateInviteCode, INVITE_CODE_LENGTH } from './invite.js';
import { makeRng } from './priceSim.js';

describe('normalizeInviteCode', () => {
  it('uppercases and strips spaces/hyphens', () => {
    expect(normalizeInviteCode('  ab-cd ef ')).toBe('ABCDEF');
  });
});

describe('isValidInviteCode', () => {
  it('accepts valid codes regardless of formatting', () => {
    expect(isValidInviteCode('abc-23k')).toBe(true);
    expect(isValidInviteCode('ABC23K')).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidInviteCode('ABC2')).toBe(false);
    expect(isValidInviteCode('ABC23KX')).toBe(false);
  });

  it('rejects ambiguous/out-of-alphabet characters', () => {
    expect(isValidInviteCode('ABC2O0')).toBe(false); // O and 0 excluded
    expect(isValidInviteCode('ABC2!?')).toBe(false);
  });
});

describe('generateInviteCode', () => {
  it('produces a code of the correct length that is valid', () => {
    const code = generateInviteCode(makeRng(1));
    expect(code).toHaveLength(INVITE_CODE_LENGTH);
    expect(isValidInviteCode(code)).toBe(true);
  });

  it('is deterministic for the same rng', () => {
    expect(generateInviteCode(makeRng(42))).toBe(generateInviteCode(makeRng(42)));
  });

  it('different seeds tend to give different codes', () => {
    expect(generateInviteCode(makeRng(1))).not.toBe(generateInviteCode(makeRng(2)));
  });
});
