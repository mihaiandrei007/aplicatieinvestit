import React, { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Label, H1, Mono, Hairline, Button, Loading } from '../../src/components/ui';
import { endpoints, ApiError, type GroupSummary, type TournamentSummary } from '../../src/api/client';
import { theme } from '../../src/theme';

interface GroupTournaments {
  group: GroupSummary;
  tournaments: TournamentSummary[];
}

export default function ProvocariScreen() {
  const c = theme.colors;
  const router = useRouter();
  const [data, setData] = useState<GroupTournaments[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { groups } = await endpoints.groups();
    const rows = await Promise.all(
      groups.map(async (g) => ({ group: g, tournaments: (await endpoints.tournaments(g.id)).tournaments })),
    );
    setData(rows);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function createFor(groupId: string) {
    setBusy(true);
    try {
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
      await endpoints.createTournament(groupId, 'Sezon nou', now.toISOString(), end.toISOString());
      await load();
    } catch (e) { Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Creare eșuată.'); }
    finally { setBusy(false); }
  }

  async function join(id: string) {
    try { await endpoints.joinTournament(id); Alert.alert('Înscris', 'Te-ai înscris în turneu.'); load(); }
    catch (e) { Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Înscriere eșuată.'); }
  }

  if (!data) return <Loading />;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
        <Label>Turnee pe sezon</Label>
        <View style={{ marginTop: 5 }}><H1>Provocări</H1></View>
      </View>
      <Hairline inset={20} />

      {data.length === 0 && (
        <Text style={{ color: c.muted, padding: 20 }}>Intră într-un grup ca să poți crea sau juca turnee.</Text>
      )}

      {data.map(({ group, tournaments }) => (
        <View key={group.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            <Label>{group.name}</Label>
            <Pressable onPress={() => createFor(group.id)} disabled={busy}>
              <Text style={{ color: c.lime, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>+ Turneu</Text>
            </Pressable>
          </View>
          <Hairline inset={20} />
          {tournaments.length === 0 ? (
            <Text style={{ color: c.faint, paddingHorizontal: 20, paddingVertical: 12, fontSize: 13 }}>Niciun turneu activ.</Text>
          ) : (
            tournaments.map((t) => (
              <View key={t.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 }}>
                  <Pressable style={{ flex: 1 }} onPress={() => router.push(`/tournament/${t.id}`)}>
                    <Text style={{ color: c.text, fontSize: 15, fontWeight: '700' }}>{t.name}</Text>
                    <Mono style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{t.participants} participanți · vezi clasament ›</Mono>
                  </Pressable>
                  <Pressable onPress={() => join(t.id)} style={{ borderWidth: 1, borderColor: c.lime, borderRadius: 5, paddingHorizontal: 14, paddingVertical: 8 }}>
                    <Text style={{ color: c.lime, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>Înscrie-te</Text>
                  </Pressable>
                </View>
                <Hairline inset={20} />
              </View>
            ))
          )}
        </View>
      ))}

      <View style={{ height: 20 }} />
    </Screen>
  );
}
