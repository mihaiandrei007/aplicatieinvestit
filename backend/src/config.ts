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
  startingCash: Number(process.env.STARTING_CASH ?? 100000),
  /** Limită de tranzacții pe zi per utilizator (anti-overtrading, Etapa 4). */
  dailyTradeLimit: Number(process.env.DAILY_TRADE_LIMIT ?? 20),
  /** Client ID-uri OAuth (audiența așteptată în ID token). */
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  appleClientId: process.env.APPLE_CLIENT_ID ?? '',
  isProd: process.env.NODE_ENV === 'production',
} as const;
