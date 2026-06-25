import { describe, it, expect } from 'vitest';
import { normalizeInviteCode, isValidInviteCode, generateInviteCode, INVITE_CODE_LENGTH } from './invite.js';
import { makeRng } from './priceSim.js';

describe('normalizeInviteCode', () => {
  it('pune majuscule și elimină spații/cratime', () => {
    expect(normalizeInviteCode('  ab-cd ef ')).toBe('ABCDEF');
  });
});

describe('isValidInviteCode', () => {
  it('acceptă coduri valide indiferent de formatare', () => {
    expect(isValidInviteCode('abc-23k')).toBe(true);
    expect(isValidInviteCode('ABC23K')).toBe(true);
  });

  it('respinge lungime greșită', () => {
    expect(isValidInviteCode('ABC2')).toBe(false);
    expect(isValidInviteCode('ABC23KX')).toBe(false);
  });

  it('respinge caractere ambigue/în afara alfabetului', () => {
    expect(isValidInviteCode('ABC2O0')).toBe(false); // O și 0 excluse
    expect(isValidInviteCode('ABC2!?')).toBe(false);
  });
});

describe('generateInviteCode', () => {
  it('produce un cod de lungimea corectă și valid', () => {
    const code = generateInviteCode(makeRng(1));
    expect(code).toHaveLength(INVITE_CODE_LENGTH);
    expect(isValidInviteCode(code)).toBe(true);
  });

  it('e determinist pentru același rng', () => {
    expect(generateInviteCode(makeRng(42))).toBe(generateInviteCode(makeRng(42)));
  });

  it('seed-uri diferite tind să dea coduri diferite', () => {
    expect(generateInviteCode(makeRng(1))).not.toBe(generateInviteCode(makeRng(2)));
  });
});
