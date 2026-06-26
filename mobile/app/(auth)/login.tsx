import React, { useState } from 'react';
import { Link } from 'expo-router';
import { Alert, Text } from 'react-native';
import { Screen, Title, Subtitle, Card, Field, Button, ErrorText } from '../../src/components/ui';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';
import { theme } from '../../src/theme';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Autentificare eșuată.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Title>InvestPals</Title>
      <Subtitle>Investiții virtuale între prieteni. Zero risc real.</Subtitle>
      <Card>
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="email@exemplu.ro" />
        <Field label="Parolă" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <ErrorText>{error}</ErrorText>
        <Button title="Intră în cont" onPress={onSubmit} loading={loading} />
      </Card>
      <Card>
        <Subtitle>Sau continuă cu</Subtitle>
        <Button
          title="Continuă cu Google"
          variant="ghost"
          onPress={() =>
            Alert.alert(
              'OAuth Google',
              'Backend-ul acceptă /api/auth/oauth. Configurează GOOGLE_CLIENT_ID și expo-auth-session, apoi trimite idToken-ul prin useAuth().signInWithOAuth. Vezi mobile/README.md.',
            )
          }
        />
        <Button
          title="Continuă cu Apple"
          variant="ghost"
          onPress={() =>
            Alert.alert('OAuth Apple', 'Disponibil pe iOS cu expo-apple-authentication + APPLE_CLIENT_ID. Vezi mobile/README.md.')
          }
        />
      </Card>
      <Link href="/(auth)/register" asChild>
        <Text style={{ color: theme.colors.primary, textAlign: 'center' }}>Nu ai cont? Înregistrează-te</Text>
      </Link>
    </Screen>
  );
}
