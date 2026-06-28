import { Redirect } from 'expo-router';

/** Entry point: AuthGate (from _layout) will redirect correctly. */
export default function Index() {
  return <Redirect href="/(tabs)/portfolio" />;
}
