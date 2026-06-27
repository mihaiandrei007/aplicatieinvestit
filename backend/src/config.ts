/** Configurare centralizată, citită din variabile de mediu. */

const isProd = process.env.NODE_ENV === 'production';
const DEV_SECRET = 'dev-secret-schimba-ma';

function jwtSecret(): string {
  const value = process.env.JWT_SECRET;
  // În producție, refuză să pornească fără un secret real.
  if (isProd && (!value || value === DEV_SECRET)) {
    throw new Error('JWT_SECRET trebuie setat (valoare lungă, aleatorie) în producție.');
  }
  return value ?? DEV_SECRET;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: jwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  startingCash: Number(process.env.STARTING_CASH ?? 10000),
  /** Buget de tranzacții (anti-overtrading): credite de start + plafon. */
  tradeCreditsStart: Number(process.env.TRADE_CREDITS_START ?? 20),
  tradeCreditsMax: Number(process.env.TRADE_CREDITS_MAX ?? 30),
  /** Client ID-uri OAuth (audiența așteptată în ID token). */
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  appleClientId: process.env.APPLE_CLIENT_ID ?? '',
  isProd,
} as const;
