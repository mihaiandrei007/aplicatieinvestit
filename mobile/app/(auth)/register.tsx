import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Screen, Label, Field, Button, Segmented, ErrorText } from '../../src/components/ui';
import { useAuth } from '../../src/auth/AuthContext';
import { ApiError } from '../../src/api/client';
import { theme } from '../../src/theme';

export default function Register() {
  const c = theme.colors;
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('NEW');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError('');
    if (displayName.trim().length < 2) { setError('Enter your name.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim(), {
        role: role || undefined,
        experience: experience || undefined,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ color: c.text, fontSize: 28, fontWeight: '800', letterSpacing: -1 }}>New account</Text>
        <Label style={{ marginTop: 6 }}>You get 10,000 virtual to start · zero real risk</Label>

        {/* --- You --- */}
        <View style={{ marginTop: 26 }}><Label>Your details</Label></View>
        <View style={{ height: 10 }} />
        <Field label="Display name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" placeholder="Ana" />
        <View style={{ height: 12 }} />
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="email@example.com" />

        {/* --- About you --- */}
        <View style={{ marginTop: 24 }}><Label>You are a…</Label></View>
        <View style={{ height: 10 }} />
        <Segmented
          options={[{ key: 'STUDENT_M', label: 'Student (M)' }, { key: 'STUDENT_F', label: 'Student (F)' }, { key: 'OTHER', label: 'Other' }]}
          value={role}
          onChange={setRole}
        />

        <View style={{ marginTop: 20 }}><Label>Investing experience</Label></View>
        <View style={{ height: 10 }} />
        <Segmented
          options={[{ key: 'NEW', label: 'New' }, { key: 'SOME', label: 'Some' }, { key: 'PRO', label: 'Pro' }]}
          value={experience}
          onChange={setExperience}
        />

        {/* --- Security --- */}
        <View style={{ marginTop: 24 }}><Label>Password</Label></View>
        <View style={{ height: 10 }} />
        <Field label="Password (min. 8)" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <View style={{ height: 12 }} />
        <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="••••••••" />

        <ErrorText>{error}</ErrorText>
        <View style={{ height: 14 }} />
        <Button title="CREATE ACCOUNT" onPress={onSubmit} loading={loading} />

        <View style={{ height: 20 }} />
        <Link href="/(auth)/login" style={{ color: c.lime, textAlign: 'center', fontSize: 13, fontWeight: '700' }}>
          Already have an account? Log in
        </Link>
      </ScrollView>
    </Screen>
  );
}
