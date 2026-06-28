/**
 * lib/oauth — PURE validation of an OAuth (Google/Apple) token's claims.
 *
 * Signature verification (JWKS, network) lives in services/oauthService.
 * Here we validate only the decoded content: issuer, audience, expiry, email.
 */

export type OAuthProvider = 'google' | 'apple';

/** The relevant claims from a decoded ID token. */
export interface OAuthClaims {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  exp?: number;
}

/** Normalized profile extracted from a valid token. */
export interface OAuthProfile {
  provider: OAuthProvider;
  providerSub: string;
  email: string;
  displayName: string;
}

/** Accepted issuers per provider. */
export const ISSUERS: Record<OAuthProvider, string[]> = {
  google: ['https://accounts.google.com', 'accounts.google.com'],
  apple: ['https://appleid.apple.com'],
};

export class OAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuthError';
  }
}

function audienceMatches(aud: string | string[] | undefined, expected: string): boolean {
  if (aud === undefined) return false;
  return Array.isArray(aud) ? aud.includes(expected) : aud === expected;
}

/**
 * Validates the claims and returns a normalized profile.
 * `nowSec` allows testing expiry without a real clock.
 */
export function validateClaims(
  provider: OAuthProvider,
  claims: OAuthClaims,
  expectedAudience: string,
  nowSec: number,
): OAuthProfile {
  if (!claims.iss || !ISSUERS[provider].includes(claims.iss)) {
    throw new OAuthError(`Invalid issuer (iss) for ${provider}.`);
  }
  if (!audienceMatches(claims.aud, expectedAudience)) {
    throw new OAuthError('Invalid audience (aud) — does not match the client ID.');
  }
  if (typeof claims.exp === 'number' && claims.exp < nowSec) {
    throw new OAuthError('Token expired.');
  }
  if (!claims.sub) {
    throw new OAuthError('Missing subject (sub).');
  }
  const verified = claims.email_verified === true || claims.email_verified === 'true';
  if (!claims.email || !verified) {
    throw new OAuthError('Email missing or not verified.');
  }

  const email = claims.email.toLowerCase();
  return {
    provider,
    providerSub: claims.sub,
    email,
    displayName: claims.name?.trim() || email.split('@')[0]!,
  };
}
