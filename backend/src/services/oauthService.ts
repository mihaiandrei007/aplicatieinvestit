/**
 * Verificarea ID token-urilor OAuth (Google/Apple) prin JWKS.
 *
 * Verifică semnătura RS256 cu cheile publice ale providerului, apoi delegă
 * validarea claim-urilor către lib/oauth (pur, testat). Fără dependențe externe:
 * folosește `crypto.createPublicKey({ format: 'jwk' })` din Node.
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

/** Cache simplu de chei publice per provider (cu expirare). */
const jwksCache = new Map<OAuthProvider, { keys: Jwk[]; fetchedAt: number }>();
const JWKS_TTL_MS = 60 * 60 * 1000;

async function getKeys(provider: OAuthProvider, nowMs: number): Promise<Jwk[]> {
  const cached = jwksCache.get(provider);
  if (cached && nowMs - cached.fetchedAt < JWKS_TTL_MS) return cached.keys;

  const res = await fetch(JWKS_URLS[provider]);
  if (!res.ok) throw new OAuthError(`Nu pot obține cheile ${provider} (HTTP ${res.status}).`);
  const data = (await res.json()) as { keys: Jwk[] };
  jwksCache.set(provider, { keys: data.keys, fetchedAt: nowMs });
  return data.keys;
}

function decodeKid(token: string): string {
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded?.header.kid;
  if (!kid) throw new OAuthError('Token fără kid în antet.');
  return kid;
}

function audienceFor(provider: OAuthProvider): string {
  const aud = provider === 'google' ? config.googleClientId : config.appleClientId;
  if (!aud) throw new OAuthError(`Client ID ${provider} neconfigurat pe server.`);
  return aud;
}

/** Verifică un ID token și întoarce profilul normalizat. */
export async function verifyOAuthToken(provider: OAuthProvider, idToken: string): Promise<OAuthProfile> {
  const nowMs = Date.now();
  const kid = decodeKid(idToken);
  const keys = await getKeys(provider, nowMs);
  const jwk = keys.find((k) => k.kid === kid);
  if (!jwk) throw new OAuthError('Cheia de semnare nu a fost găsită în JWKS.');

  const publicKey = createPublicKey({ key: jwk as unknown as JsonWebKey, format: 'jwk' });

  let payload: OAuthClaims;
  try {
    payload = jwt.verify(idToken, publicKey, { algorithms: ['RS256'] }) as OAuthClaims;
  } catch (err) {
    throw new OAuthError(`Semnătură invalidă: ${(err as Error).message}`);
  }

  return validateClaims(provider, payload, audienceFor(provider), Math.floor(nowMs / 1000));
}
