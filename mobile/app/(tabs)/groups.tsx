import React, { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Title, Subtitle, Card, Field, Button, Loading } from '../../src/components/ui';
import { endpoints, ApiError, type GroupSummary } from '../../src/api/client';
import { theme } from '../../src/theme';

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { groups } = await endpoints.groups();
    setGroups(groups);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function create() {
    if (name.trim().length < 2) return;
    setBusy(true);
    try {
      const res = await endpoints.createGroup(name.trim());
      setName('');
      await load();
      Alert.alert('Grup creat', `Cod de invitație: ${res.group.inviteCode}`);
    } catch (e) {
      Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Creare eșuată.');
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await endpoints.joinGroup(code.trim());
      setCode('');
      await load();
    } catch (e) {
      Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Alăturare eșuată.');
    } finally {
      setBusy(false);
    }
  }

  if (!groups) return <Loading />;

  return (
    <Screen>
      <Title>Grupuri</Title>

      {groups.map((g) => (
        <Pressable key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>{g.name}</Text>
              <Text style={{ color: theme.colors.muted }}>{g.memberCount} membri</Text>
            </View>
            <Text style={{ color: theme.colors.muted }}>
              Cod: {g.inviteCode} · {g.role === 'OWNER' ? 'Proprietar' : 'Membru'}
            </Text>
          </Card>
        </Pressable>
      ))}

      <Card>
        <Subtitle>Creează un grup</Subtitle>
        <Field label="Nume grup" value={name} onChangeText={setName} placeholder="Prietenii de la liceu" />
        <Button title="Creează" onPress={create} loading={busy} />
      </Card>

      <Card>
        <Subtitle>Intră într-un grup</Subtitle>
        <Field label="Cod de invitație" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="ABC234" />
        <Button title="Alătură-te" onPress={join} loading={busy} />
      </Card>
    </Screen>
  );
}
