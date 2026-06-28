/**
 * Verification of OAuth (Google/Apple) ID tokens via JWKS.
 *
 * Verifies the RS256 signature with the provider's public keys, then delegates
 * claim validation to lib/oauth (pure, tested). No external dependencies:
 * uses Node's `crypto.createPublicKey({ format: 'jwk' })`.
 */

import { createPublicKey, type JsonWebKey } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { validateClaims, OAuthError, type OAuthProvider, type OAuthProfile, type OAuthClaims } from '../lib/oauth.js';

const JWKS_URLS: Record<OAuthProvider, string> = {
  google: 'https://www.googleapis.com/oauth2/v3/certs',
  apple: 'https://appleid.apple.com/auth/keys',
};

interface Jwk {
  kid: string;
  kty: string;
  use?: string;
  n?: string;
  e?: string;
  alg?: string;
}

/** Simple per-provider public key cache (with expiry). */
const jwksCache = new Map<OAuthProvider, { keys: Jwk[]; fetchedAt: number }>();
const JWKS_TTL_MS = 60 * 60 * 1000;

async function getKeys(provider: OAuthProvider, nowMs: number): Promise<Jwk[]> {
  const cached = jwksCache.get(provider);
  if (cached && nowMs - cached.fetchedAt < JWKS_TTL_MS) return cached.keys;

  const res = await fetch(JWKS_URLS[provider]);
  if (!res.ok) throw new OAuthError(`Cannot fetch ${provider} keys (HTTP ${res.status}).`);
  const data = (await res.json()) as { keys: Jwk[] };
  jwksCache.set(provider, { keys: data.keys, fetchedAt: nowMs });
  return data.keys;
}

function decodeKid(token: string): string {
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded?.header.kid;
  if (!kid) throw new OAuthError('Token without kid in the header.');
  return kid;
}

function audienceFor(provider: OAuthProvider): string {
  const aud = provider === 'google' ? config.googleClientId : config.appleClientId;
  if (!aud) throw new OAuthError(`${provider} client ID not configured on the server.`);
  return aud;
}

/** Verifies an ID token and returns the normalized profile. */
export async function verifyOAuthToken(provider: OAuthProvider, idToken: string): Promise<OAuthProfile> {
  const nowMs = Date.now();
  const kid = decodeKid(idToken);
  const keys = await getKeys(provider, nowMs);
  const jwk = keys.find((k) => k.kid === kid);
  if (!jwk) throw new OAuthError('Signing key not found in JWKS.');

  const publicKey = createPublicKey({ key: jwk as unknown as JsonWebKey, format: 'jwk' });

  let payload: OAuthClaims;
  try {
    payload = jwt.verify(idToken, publicKey, { algorithms: ['RS256'] }) as OAuthClaims;
  } catch (err) {
    throw new OAuthError(`Invalid signature: ${(err as Error).message}`);
  }

  return validateClaims(provider, payload, audienceFor(provider), Math.floor(nowMs / 1000));
}
