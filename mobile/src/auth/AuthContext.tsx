import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { endpoints, setAuthToken, type PublicUser } from '../api/client';

const TOKEN_KEY = 'investpals_token';

interface AuthState {
  user: PublicUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  /** La pornire: încearcă să restaureze sesiunea din stocarea securizată. */
  useEffect(() => {
    (async () => {
      try {
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

  async function persist(token: string, user: PublicUser): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setAuthToken(token);
    setUser(user);
  }

  const value: AuthState = {
    user,
    loading,
    signIn: async (email, password) => {
      const res = await endpoints.login(email, password);
      await persist(res.token, res.user);
    },
    signUp: async (email, password, displayName) => {
      const res = await endpoints.register(email, password, displayName);
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
  if (!ctx) throw new Error('useAuth trebuie folosit în interiorul AuthProvider.');
  return ctx;
}
