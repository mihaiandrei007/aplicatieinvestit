import React, { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Label, H1, Mono, Hairline, Field, Button, Monogram, Loading } from '../../src/components/ui';
import { endpoints, ApiError, type GroupSummary } from '../../src/api/client';
import { theme } from '../../src/theme';

export default function GroupsScreen() {
  const c = theme.colors;
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { groups } = await endpoints.groups();
    setGroups(groups);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function create() {
    if (name.trim().length < 2) return;
    setBusy(true);
    try {
      const r = await endpoints.createGroup(name.trim());
      setName('');
      await load();
      Alert.alert('Grup creat', `Cod de invitație: ${r.group.inviteCode}`);
    } catch (e) {
      Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Creare eșuată.');
    } finally { setBusy(false); }
  }

  async function join() {
    if (!code.trim()) return;
    setBusy(true);
    try { await endpoints.joinGroup(code.trim()); setCode(''); await load(); }
    catch (e) { Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Alăturare eșuată.'); }
    finally { setBusy(false); }
  }

  if (!groups) return <Loading />;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
        <Label>Ligi private</Label>
        <View style={{ marginTop: 5 }}><H1>Grupuri</H1></View>
      </View>
      <Hairline inset={20} />

      {groups.map((g) => (
        <View key={g.id}>
          <Pressable onPress={() => router.push(`/group/${g.id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 }}>
              <Monogram name={g.name} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{g.name}</Text>
                <Mono style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{g.memberCount} membri · {g.role === 'OWNER' ? 'proprietar' : 'membru'}</Mono>
              </View>
              <Mono style={{ color: c.lime, fontSize: 12, fontWeight: '700' }}>{g.inviteCode}</Mono>
            </View>
          </Pressable>
          <Hairline inset={20} />
        </View>
      ))}

      <View style={{ padding: 20, gap: 12 }}>
        <Label>Creează un grup</Label>
        <Field label="Nume grup" value={name} onChangeText={setName} placeholder="Prietenii de la liceu" />
        <Button title="CREEAZĂ" onPress={create} loading={busy} />
      </View>
      <Hairline inset={20} />
      <View style={{ padding: 20, gap: 12 }}>
        <Label>Intră cu un cod</Label>
        <Field label="Cod de invitație" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="ABC234" />
        <Button title="ALĂTURĂ-TE" variant="ghost" onPress={join} loading={busy} />
      </View>
    </Screen>
  );
}
