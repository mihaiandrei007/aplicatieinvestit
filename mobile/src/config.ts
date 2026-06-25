import Constants from 'expo-constants';

/**
 * URL-ul API-ului. În dezvoltare, pe un dispozitiv fizic, înlocuiește `localhost`
 * cu IP-ul calculatorului (ex. http://192.168.1.10:4000). Pe emulator Android
 * folosește http://10.0.2.2:4000.
 */
export const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:4000';

/** URL-ul WebSocket derivat din API_URL. */
export const WS_URL: string = API_URL.replace(/^http/, 'ws') + '/ws';
