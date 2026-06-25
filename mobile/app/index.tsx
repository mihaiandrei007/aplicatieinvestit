import { Redirect } from 'expo-router';

/** Punct de intrare: AuthGate (din _layout) va redirecționa corect. */
export default function Index() {
  return <Redirect href="/(tabs)/portfolio" />;
}
