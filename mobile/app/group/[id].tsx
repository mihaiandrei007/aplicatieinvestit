import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Screen, Subtitle, Card, Loading } from '../../src/components/ui';
import { endpoints, type LeaderboardEntry, type FeedEvent } from '../../src/api/client';
import { theme, formatMoney, formatPct } from '../../src/theme';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [tab, setTab] = useState<'leaderboard' | 'feed'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [feed, setFeed] = useState<FeedEvent[] | null>(null);
  const [groupName, setGroupName] = useState('Grup');

  const load = useCallback(async () => {
    if (!id) return;
    const [lb, fd] = await Promise.all([endpoints.leaderboard(id), endpoints.feed(id)]);
    setLeaderboard(lb.leaderboard);
    setGroupName(lb.group.name);
    setFeed(fd.events);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    navigation.setOptions({ title: groupName });
  }, [navigation, groupName]);

  async function react(eventId: string, emoji: string) {
    await endpoints.react(eventId, emoji);
    load();
  }

  if (!leaderboard || !feed) return <Loading />;

  return (
    <Screen scroll={false}>
      <View style={{ flexDirection: 'row', gap: theme.spacing(1), marginBottom: theme.spacing(1) }}>
        <TabButton label="Clasament" active={tab === 'leaderboard'} onPress={() => setTab('leaderboard')} />
        <TabButton label="Feed" active={tab === 'feed'} onPress={() => setTab('feed')} />
      </View>

      <ScrollView contentContainerStyle={{ gap: theme.spacing(1) }}>
        {tab === 'leaderboard'
          ? leaderboard.map((e) => (
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
            ))
          : feed.length === 0
            ? (
                <Card>
                  <Text style={{ color: theme.colors.muted }}>Niciun eveniment încă.</Text>
                </Card>
              )
            : feed.map((ev) => (
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
              ))}
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
      <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}
