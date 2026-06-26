import { describe, it, expect } from 'vitest';
import { validateClaims, OAuthError, type OAuthClaims } from './oauth.js';

const NOW = 1_700_000_000;
const valid: OAuthClaims = {
  iss: 'https://accounts.google.com',
  aud: 'client-123',
  sub: 'google-sub-1',
  email: 'Ana@Test.RO',
  email_verified: true,
  name: 'Ana Popescu',
  exp: NOW + 3600,
};

describe('validateClaims', () => {
  it('întoarce un profil normalizat pentru un token valid', () => {
    const profile = validateClaims('google', valid, 'client-123', NOW);
    expect(profile).toEqual({
      provider: 'google',
      providerSub: 'google-sub-1',
      email: 'ana@test.ro',
      displayName: 'Ana Popescu',
    });
  });

  it('acceptă audiență ca array', () => {
    const profile = validateClaims('google', { ...valid, aud: ['other', 'client-123'] }, 'client-123', NOW);
    expect(profile.providerSub).toBe('google-sub-1');
  });

  it('respinge emitent invalid', () => {
    expect(() => validateClaims('google', { ...valid, iss: 'evil.com' }, 'client-123', NOW)).toThrow(OAuthError);
  });

  it('respinge audiență greșită', () => {
    expect(() => validateClaims('google', valid, 'alt-client', NOW)).toThrow(/Audiență/);
  });

  it('respinge token expirat', () => {
    expect(() => validateClaims('google', { ...valid, exp: NOW - 1 }, 'client-123', NOW)).toThrow(/expirat/);
  });

  it('respinge email neverificat', () => {
    expect(() => validateClaims('google', { ...valid, email_verified: false }, 'client-123', NOW)).toThrow(
      /neverificat/,
    );
  });

  it('acceptă email_verified ca string „true" (Apple)', () => {
    const profile = validateClaims('apple', { ...valid, iss: 'https://appleid.apple.com', email_verified: 'true' }, 'client-123', NOW);
    expect(profile.provider).toBe('apple');
  });

  it('derivă displayName din email când lipsește numele', () => {
    const profile = validateClaims('google', { ...valid, name: undefined }, 'client-123', NOW);
    expect(profile.displayName).toBe('ana'); // partea locală din email-ul normalizat
  });
});
