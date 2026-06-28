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
      Alert.alert('Group created', `Invite code: ${r.group.inviteCode}`);
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Creation failed.');
    } finally { setBusy(false); }
  }

  async function join() {
    if (!code.trim()) return;
    setBusy(true);
    try { await endpoints.joinGroup(code.trim()); setCode(''); await load(); }
    catch (e) { Alert.alert('Error', e instanceof ApiError ? e.message : 'Join failed.'); }
    finally { setBusy(false); }
  }

  if (!groups) return <Loading />;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
        <Label>Private leagues</Label>
        <View style={{ marginTop: 5 }}><H1>Groups</H1></View>
      </View>
      <Hairline inset={20} />

      {groups.map((g) => (
        <View key={g.id}>
          <Pressable onPress={() => router.push(`/group/${g.id}`)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 }}>
              <Monogram name={g.name} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{g.name}</Text>
                <Mono style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{g.memberCount} members · {g.role === 'OWNER' ? 'owner' : 'member'}</Mono>
              </View>
              <Mono style={{ color: c.lime, fontSize: 12, fontWeight: '700' }}>{g.inviteCode}</Mono>
            </View>
          </Pressable>
          <Hairline inset={20} />
        </View>
      ))}

      <View style={{ padding: 20, gap: 12 }}>
        <Label>Create a group</Label>
        <Field label="Group name" value={name} onChangeText={setName} placeholder="High school friends" />
        <Button title="CREATE" onPress={create} loading={busy} />
      </View>
      <Hairline inset={20} />
      <View style={{ padding: 20, gap: 12 }}>
        <Label>Join with a code</Label>
        <Field label="Invite code" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="ABC234" />
        <Button title="JOIN" variant="ghost" onPress={join} loading={busy} />
      </View>
    </Screen>
  );
}
