import React, { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Label, Field, Button, ErrorText } from '../../src/components/ui';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';
import { theme } from '../../src/theme';

export default function Login() {
  const c = theme.colors;
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(''); setLoading(true);
    try { await signIn(email.trim(), password); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Log in failed.'); }
    finally { setLoading(false); }
  }

  return (
    <Screen>
      <View style={{ padding: 20, paddingTop: 60, gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, backgroundColor: c.lime, borderRadius: 1 }} />
          <Text style={{ color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -1 }}>InvestPals</Text>
        </View>
        <Label>Virtual stock market among friends · zero real risk</Label>

        <View style={{ height: 24 }} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@example.com" />
        <View style={{ height: 12 }} />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <ErrorText>{error}</ErrorText>
        <View style={{ height: 8 }} />
        <Button title="LOG IN" onPress={onSubmit} loading={loading} />

        <View style={{ height: 28 }} />
        <Label>Or continue with</Label>
        <View style={{ height: 8 }} />
        <Button title="GOOGLE" variant="ghost" onPress={() => Alert.alert('OAuth Google', 'Backend ready (/api/auth/oauth). Configure GOOGLE_CLIENT_ID + expo-auth-session.')} />
        <View style={{ height: 10 }} />
        <Button title="APPLE" variant="ghost" onPress={() => Alert.alert('OAuth Apple', 'Available on iOS with expo-apple-authentication.')} />

        <View style={{ height: 24 }} />
        <Link href="/(auth)/register" style={{ color: c.lime, textAlign: 'center', fontSize: 13, fontWeight: '700' }}>
          No account? Sign up
        </Link>
      </View>
    </Screen>
  );
}
