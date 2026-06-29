import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { endpoints, setAuthToken, type PublicUser } from '../api/client';
import { registerForPush } from '../push/registerPush';

const TOKEN_KEY = 'investpals_token';
const ONBOARD_KEY = 'investpals_onboarded';

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  /** Whether the first-launch tutorial has been completed on this device. */
  onboarded: boolean;
  completeOnboarding: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, extras?: { role?: string; experience?: string }) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'apple', idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);

  /** On startup: restore the session and read the onboarding flag from secure storage. */
  useEffect(() => {
    (async () => {
      try {
        const seen = await SecureStore.getItemAsync(ONBOARD_KEY);
        setOnboarded(seen === '1');
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          setAuthToken(token);
          const { user } = await endpoints.me();
          setUser(user);
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** Register push when a session exists (best-effort, only on a physical device). */
  useEffect(() => {
    if (user) registerForPush().catch(() => {});
  }, [user]);

  async function persist(token: string, user: PublicUser): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(user);
  }

  const value: AuthState = {
    user,
    loading,
    onboarded,
    completeOnboarding: async () => {
      await SecureStore.setItemAsync(ONBOARD_KEY, '1');
      setOnboarded(true);
    },
    signIn: async (email, password) => {
      const res = await endpoints.login(email, password);
      await persist(res.token, res.user);
    },
    signUp: async (email, password, displayName, extras) => {
      const res = await endpoints.register(email, password, displayName, extras);
      await persist(res.token, res.user);
    },
    signInWithOAuth: async (provider, idToken) => {
      const res = await endpoints.oauth(provider, idToken);
      await persist(res.token, res.user);
    },
    signOut: async () => {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setAuthToken(null);
      setUser(null);
    },
    refresh: async () => {
      const { user } = await endpoints.me();
      setUser(user);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider.');
  return ctx;
}
