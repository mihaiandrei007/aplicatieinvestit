import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Small key/value storage that works on both native and web.
 * Native uses expo-secure-store; web (where SecureStore is unavailable)
 * falls back to localStorage. Used for the auth token + onboarding flag.
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* ignore */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* ignore */
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
