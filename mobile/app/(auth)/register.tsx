import React, { useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';
import { Screen, Title, Subtitle, Card, Field, Button, ErrorText } from '../../src/components/ui';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';
import { theme } from '../../src/theme';

export default function Register() {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Înregistrare eșuată.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>Cont nou</Title>
      <Subtitle>Primești 100.000 (virtuali) de start.</Subtitle>
      <Card>
        <Field label="Nume afișat" value={displayName} onChangeText={setDisplayName} placeholder="Ana" autoCapitalize="words" />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@exemplu.ro" />
        <Field label="Parolă (min. 8 caractere)" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <ErrorText>{error}</ErrorText>
        <Button title="Creează cont" onPress={onSubmit} loading={loading} />
      </Card>
      <Link href="/(auth)/login" asChild>
        <Text style={{ color: theme.colors.primary, textAlign: 'center' }}>Ai deja cont? Autentifică-te</Text>
      </Link>
    </Screen>
  );
}
