/** Centralized configuration, read from environment variables. */

const isProd = process.env.NODE_ENV === 'production';
const DEV_SECRET = 'dev-secret-change-me';

function jwtSecret(): string {
  const value = process.env.JWT_SECRET;
  // In production, refuse to start without a real secret.
  if (isProd && (!value || value === DEV_SECRET)) {
    throw new Error('JWT_SECRET must be set (a long, random value) in production.');
  }
  return value ?? DEV_SECRET;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: jwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  startingCash: Number(process.env.STARTING_CASH ?? 10000),
  /** Trade budget (anti-overtrading): starting credits + cap. */
  tradeCreditsStart: Number(process.env.TRADE_CREDITS_START ?? 20),
  tradeCreditsMax: Number(process.env.TRADE_CREDITS_MAX ?? 30),
  /** OAuth client IDs (the expected audience in the ID token). */
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  appleClientId: process.env.APPLE_CLIENT_ID ?? '',
  isProd,
} as const;
