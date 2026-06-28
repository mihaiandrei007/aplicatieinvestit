import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { Loading } from '../src/components/ui';

/** Redirects between the authenticated area and the login screens. */
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/portfolio');
    }
  }, [user, loading, segments, router]);

  if (loading) return <Loading />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0B0D' } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="group/[id]" options={stackHeader('Group')} />
      <Stack.Screen name="profile" options={stackHeader('Profile')} />
      <Stack.Screen name="news" options={stackHeader('News')} />
      <Stack.Screen name="wrapped" options={stackHeader('Wrapped')} />
      <Stack.Screen name="tournament/[id]" options={stackHeader('Tournament')} />
    </Stack>
  );
}

function stackHeader(title: string) {
  return {
    headerShown: true,
    title,
    headerStyle: { backgroundColor: '#0A0B0D' },
    headerTintColor: '#E8EAED',
  } as const;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AuthGate />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
