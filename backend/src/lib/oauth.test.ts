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
  it('returns a normalized profile for a valid token', () => {
    const profile = validateClaims('google', valid, 'client-123', NOW);
    expect(profile).toEqual({
      provider: 'google',
      providerSub: 'google-sub-1',
      email: 'ana@test.ro',
      displayName: 'Ana Popescu',
    });
  });

  it('accepts audience as an array', () => {
    const profile = validateClaims('google', { ...valid, aud: ['other', 'client-123'] }, 'client-123', NOW);
    expect(profile.providerSub).toBe('google-sub-1');
  });

  it('rejects an invalid issuer', () => {
    expect(() => validateClaims('google', { ...valid, iss: 'evil.com' }, 'client-123', NOW)).toThrow(OAuthError);
  });

  it('rejects a wrong audience', () => {
    expect(() => validateClaims('google', valid, 'alt-client', NOW)).toThrow(/audience/);
  });

  it('rejects an expired token', () => {
    expect(() => validateClaims('google', { ...valid, exp: NOW - 1 }, 'client-123', NOW)).toThrow(/expired/);
  });

  it('rejects an unverified email', () => {
    expect(() => validateClaims('google', { ...valid, email_verified: false }, 'client-123', NOW)).toThrow(
      /not verified/,
    );
  });

  it('accepts email_verified as the string "true" (Apple)', () => {
    const profile = validateClaims('apple', { ...valid, iss: 'https://appleid.apple.com', email_verified: 'true' }, 'client-123', NOW);
    expect(profile.provider).toBe('apple');
  });

  it('derives displayName from the email when the name is missing', () => {
    const profile = validateClaims('google', { ...valid, name: undefined }, 'client-123', NOW);
    expect(profile.displayName).toBe('ana'); // the local part of the normalized email
  });
});
