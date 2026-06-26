/**
 * lib/oauth — validare PURĂ a claim-urilor unui token OAuth (Google/Apple).
 *
 * Verificarea semnăturii (JWKS, rețea) stă în services/oauthService.
 * Aici validăm doar conținutul decodat: emitent, audiență, expirare, email.
 */

export type OAuthProvider = 'google' | 'apple';

/** Claim-urile relevante dintr-un ID token decodat. */
export interface OAuthClaims {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  exp?: number;
}

/** Profil normalizat extras dintr-un token valid. */
export interface OAuthProfile {
  provider: OAuthProvider;
  providerSub: string;
  email: string;
  displayName: string;
}

/** Emitenții acceptați per provider. */
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
 * Validează claim-urile și întoarce un profil normalizat.
 * `nowSec` permite testarea expirării fără ceas real.
 */
export function validateClaims(
  provider: OAuthProvider,
  claims: OAuthClaims,
  expectedAudience: string,
  nowSec: number,
): OAuthProfile {
  if (!claims.iss || !ISSUERS[provider].includes(claims.iss)) {
    throw new OAuthError(`Emitent (iss) invalid pentru ${provider}.`);
  }
  if (!audienceMatches(claims.aud, expectedAudience)) {
    throw new OAuthError('Audiență (aud) invalidă — nu corespunde client ID-ului.');
  }
  if (typeof claims.exp === 'number' && claims.exp < nowSec) {
    throw new OAuthError('Token expirat.');
  }
  if (!claims.sub) {
    throw new OAuthError('Lipsește subiectul (sub).');
  }
  const verified = claims.email_verified === true || claims.email_verified === 'true';
  if (!claims.email || !verified) {
    throw new OAuthError('Email lipsă sau neverificat.');
  }

  const email = claims.email.toLowerCase();
  return {
    provider,
    providerSub: claims.sub,
    email,
    displayName: claims.name?.trim() || email.split('@')[0]!,
  };
}
