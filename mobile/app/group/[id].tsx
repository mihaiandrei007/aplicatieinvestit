import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Screen, Label, Mono, Hairline, Monogram, Segmented, Loading } from '../../src/components/ui';
import { endpoints, type LeaderboardEntry, type FeedEvent, type GroupSentiment } from '../../src/api/client';
import { useRealtime } from '../../src/realtime/useRealtime';
import { theme, formatMoney, formatPct, gainColor } from '../../src/theme';

type Tab = 'leaderboard' | 'feed' | 'sentiment';

export default function GroupDetail() {
  const c = theme.colors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [feed, setFeed] = useState<FeedEvent[] | null>(null);
  const [sentiment, setSentiment] = useState<GroupSentiment[]>([]);
  const [name, setName] = useState('Grup');

  const load = useCallback(async () => {
    if (!id) return;
    const [lb, fd, sn] = await Promise.all([endpoints.leaderboard(id), endpoints.feed(id), endpoints.groupSentiment(id)]);
    setLeaderboard(lb.leaderboard);
    setName(lb.group.name);
    setFeed(fd.events);
    setSentiment(sn.sentiment);
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { navigation.setOptions({ title: name }); }, [navigation, name]);
  useRealtime({ groupId: id, onMessage: (m) => { if (m.type === 'NEW_ACTIVITY') load(); } });

  async function react(eventId: string) { await endpoints.react(eventId, '🔥').catch(() => {}); load(); }

  if (!leaderboard || !feed) return <Loading />;

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <Segmented
          options={[{ key: 'leaderboard', label: 'Clasament' }, { key: 'feed', label: 'Feed' }, { key: 'sentiment', label: 'Sentiment' }]}
          value={tab}
          onChange={(k) => setTab(k as Tab)}
        />
      </View>
      <Hairline inset={20} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {tab === 'leaderboard' &&
          leaderboard.map((e) => (
            <View key={e.userId}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13 }}>
                <Text style={{ width: 22, textAlign: 'center', color: e.rank <= 3 ? c.lime : c.faint, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] }}>{e.rank}</Text>
                <Monogram name={e.displayName} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{e.displayName}{e.isMe ? '  ·  tu' : ''}</Text>
                  <Mono style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{formatMoney(e.equity)}</Mono>
                </View>
                <Mono style={{ color: gainColor(e.roi), fontSize: 16, fontWeight: '700' }}>{formatPct(e.roi)}</Mono>
              </View>
              <Hairline inset={20} />
            </View>
          ))}

        {tab === 'feed' &&
          (feed.length === 0 ? (
            <Text style={{ color: c.muted, padding: 20 }}>Niciun eveniment încă.</Text>
          ) : (
            feed.map((ev) => (
              <View key={ev.id}>
                <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
                  <Text style={{ color: c.text, fontSize: 14 }}>{ev.message}</Text>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, alignItems: 'center' }}>
                    <Pressable onPress={() => react(ev.id)}>
                      <Mono style={{ color: ev.reactions.some((r) => r.reactedByMe) ? c.lime : c.muted, fontSize: 12 }}>
                        REACȚII {ev.reactions.reduce((s, r) => s + r.count, 0)}
                      </Mono>
                    </Pressable>
                    <Mono style={{ color: c.muted, fontSize: 12 }}>COM {ev.commentCount}</Mono>
                  </View>
                </View>
                <Hairline inset={20} />
              </View>
            ))
          ))}

        {tab === 'sentiment' &&
          (sentiment.length === 0 ? (
            <Text style={{ color: c.muted, padding: 20 }}>Niciun vot. Marchează Bullish/Bearish din „Piață".</Text>
          ) : (
            sentiment.map((s) => (
              <View key={s.symbol}>
                <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: c.text, fontWeight: '700' }}>{s.symbol}{s.myValue ? `  ·  ${s.myValue === 'BULLISH' ? 'bullish' : 'bearish'}` : ''}</Text>
                    <Mono style={{ color: c.muted, fontSize: 12 }}>{s.bullish} / {s.bearish}</Mono>
                  </View>
                  <View style={{ height: 6, backgroundColor: c.red, borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{ width: `${s.bullishPct}%`, height: 6, backgroundColor: c.lime }} />
                  </View>
                  <Label style={{ marginTop: 6 }}>{s.bullishPct}% bullish</Label>
                </View>
                <Hairline inset={20} />
              </View>
            ))
          ))}
      </ScrollView>
    </Screen>
  );
}
