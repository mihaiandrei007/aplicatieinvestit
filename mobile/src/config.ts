import Constants from 'expo-constants';

/**
 * The API URL. Order: the EXPO_PUBLIC_API_URL variable (from .env at `expo start`)
 * → `expo.extra.apiUrl` from app.json → localhost (development).
 *
 * To share the app with friends (Expo Go + tunnel), set
 * EXPO_PUBLIC_API_URL to your public backend (see DISTRIBUIRE.md).
 */
export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:4000';

/** WebSocket URL derived from API_URL. */
export const WS_URL: string = API_URL.replace(/^http/, 'ws') + '/ws';
