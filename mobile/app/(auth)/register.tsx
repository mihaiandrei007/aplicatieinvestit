import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Label, Field, Button, ErrorText } from '../../src/components/ui';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';
import { theme } from '../../src/theme';

export default function Register() {
  const c = theme.colors;
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(''); setLoading(true);
    try { await signUp(email.trim(), password, displayName.trim()); }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Sign up failed.'); }
    finally { setLoading(false); }
  }

  return (
    <Screen>
      <View style={{ padding: 20, paddingTop: 60, gap: 8 }}>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: '800', letterSpacing: -1 }}>New account</Text>
        <Label>You get 10,000 virtual to start</Label>

        <View style={{ height: 24 }} />
        <Field label="Display name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" placeholder="Ana" />
        <View style={{ height: 12 }} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@example.com" />
        <View style={{ height: 12 }} />
        <Field label="Password (min. 8)" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <ErrorText>{error}</ErrorText>
        <View style={{ height: 8 }} />
        <Button title="CREATE ACCOUNT" onPress={onSubmit} loading={loading} />

        <View style={{ height: 20 }} />
        <Link href="/(auth)/login" style={{ color: c.lime, textAlign: 'center', fontSize: 13, fontWeight: '700' }}>
          Already have an account? Log in
        </Link>
      </View>
    </Screen>
  );
}
