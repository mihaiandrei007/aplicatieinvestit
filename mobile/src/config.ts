import Constants from 'expo-constants';

/**
 * URL-ul API-ului. Ordinea: variabila EXPO_PUBLIC_API_URL (din .env la `expo start`)
 * → `expo.extra.apiUrl` din app.json → localhost (dezvoltare).
 *
 * Pentru a trimite aplicația prietenilor (Expo Go + tunnel), setează
 * EXPO_PUBLIC_API_URL spre backend-ul tău public (vezi DISTRIBUIRE.md).
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000';

/** URL-ul WebSocket derivat din API_URL. */
export const WS_URL: string = API_URL.replace(/^http/, 'ws') + '/ws';
