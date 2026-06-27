/** Configurare centralizată, citită din variabile de mediu. */

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variabila de mediu ${name} este obligatorie.`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET', 'dev-secret-schimba-ma'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  startingCash: Number(process.env.STARTING_CASH ?? 10000),
  /** Buget de tranzacții (anti-overtrading): credite de start + plafon. */
  tradeCreditsStart: Number(process.env.TRADE_CREDITS_START ?? 20),
  tradeCreditsMax: Number(process.env.TRADE_CREDITS_MAX ?? 30),
  /** Client ID-uri OAuth (audiența așteptată în ID token). */
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  appleClientId: process.env.APPLE_CLIENT_ID ?? '',
  isProd: process.env.NODE_ENV === 'production',
} as const;
