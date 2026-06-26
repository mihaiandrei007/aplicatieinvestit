import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Screen, Subtitle, Card, Field, Button, Loading } from '../../src/components/ui';
import {
  endpoints,
  ApiError,
  type LeaderboardEntry,
  type FeedEvent,
  type TournamentSummary,
} from '../../src/api/client';
import { useRealtime } from '../../src/realtime/useRealtime';
import { theme, formatMoney, formatPct } from '../../src/theme';

type Tab = 'leaderboard' | 'feed' | 'tournaments';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [feed, setFeed] = useState<FeedEvent[] | null>(null);
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [groupName, setGroupName] = useState('Grup');
  const [tname, setTname] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [lb, fd, tr] = await Promise.all([
      endpoints.leaderboard(id),
      endpoints.feed(id),
      endpoints.tournaments(id),
    ]);
    setLeaderboard(lb.leaderboard);
    setGroupName(lb.group.name);
    setFeed(fd.events);
    setTournaments(tr.tournaments);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    navigation.setOptions({ title: groupName });
  }, [navigation, groupName]);

  // Feed + clasament live: reîncarcă la orice activitate nouă din grup.
  useRealtime({
    groupId: id,
    onMessage: (msg) => {
      if (msg.type === 'NEW_ACTIVITY') load();
    },
  });

  async function react(eventId: string, emoji: string) {
    await endpoints.react(eventId, emoji);
    load();
  }

  async function createTournament() {
    if (tname.trim().length < 2 || !id) return;
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 3600 * 1000);
    try {
      await endpoints.createTournament(id, tname.trim(), now.toISOString(), end.toISOString());
      setTname('');
      load();
    } catch (e) {
      Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Creare eșuată.');
    }
  }

  async function joinTournament(tid: string) {
    try {
      await endpoints.joinTournament(tid);
      Alert.alert('Înscris', 'Te-ai înscris în turneu.');
      load();
    } catch (e) {
      Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Înscriere eșuată.');
    }
  }

  if (!leaderboard || !feed) return <Loading />;

  return (
    <Screen scroll={false}>
      <View style={{ flexDirection: 'row', gap: theme.spacing(1), marginBottom: theme.spacing(1) }}>
        <TabButton label="Clasament" active={tab === 'leaderboard'} onPress={() => setTab('leaderboard')} />
        <TabButton label="Feed" active={tab === 'feed'} onPress={() => setTab('feed')} />
        <TabButton label="Turnee" active={tab === 'tournaments'} onPress={() => setTab('tournaments')} />
      </View>

      <ScrollView contentContainerStyle={{ gap: theme.spacing(1) }}>
        {tab === 'leaderboard' &&
          leaderboard.map((e) => (
            <Card key={e.userId}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>
                  {e.rank}. {e.displayName} {e.isMe ? '(tu)' : ''}
                </Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: e.roi >= 0 ? theme.colors.green : theme.colors.red, fontWeight: '700' }}>
                    {formatPct(e.roi)}
                  </Text>
                  <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{formatMoney(e.equity)}</Text>
                </View>
              </View>
            </Card>
          ))}

        {tab === 'feed' &&
          (feed.length === 0 ? (
            <Card>
              <Text style={{ color: theme.colors.muted }}>Niciun eveniment încă.</Text>
            </Card>
          ) : (
            feed.map((ev) => (
              <Card key={ev.id}>
                <Text style={{ color: theme.colors.text }}>{ev.message}</Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing(1), marginTop: 6 }}>
                  {['👍', '🔥', '🚀'].map((emoji) => {
                    const r = ev.reactions.find((x) => x.emoji === emoji);
                    return (
                      <Pressable key={emoji} onPress={() => react(ev.id, emoji)}>
                        <Text style={{ color: r?.reactedByMe ? theme.colors.primary : theme.colors.muted }}>
                          {emoji} {r?.count ?? 0}
                        </Text>
                      </Pressable>
                    );
                  })}
                  <Text style={{ color: theme.colors.muted, marginLeft: 'auto' }}>💬 {ev.commentCount}</Text>
                </View>
              </Card>
            ))
          ))}

        {tab === 'tournaments' && (
          <>
            {tournaments.map((t) => (
              <Card key={t.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{t.name}</Text>
                    <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{t.participants} participanți</Text>
                  </View>
                  <Pressable
                    onPress={() => joinTournament(t.id)}
                    style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius }}
                  >
                    <Text style={{ color: theme.colors.text }}>Înscrie-te</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
            <Card>
              <Subtitle>Creează un turneu (30 de zile)</Subtitle>
              <Field label="Nume turneu" value={tname} onChangeText={setTname} placeholder="Iunie 2026" />
              <Button title="Creează" onPress={createTournament} />
            </Card>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: theme.radius,
        backgroundColor: active ? theme.colors.primary : theme.colors.card,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
