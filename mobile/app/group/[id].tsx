import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Screen, Label, Mono, Hairline, Monogram, Segmented, Loading } from '../../src/components/ui';
import { endpoints, type LeaderboardEntry, type FeedEvent, type GroupSentiment } from '../../src/api/client';
import { useRealtime } from '../../src/realtime/useRealtime';
import { theme, formatMoney, formatPct, gainColor } from '../../src/theme';

type Tab = 'leaderboard' | 'sharpe' | 'feed' | 'sentiment';
interface SharpeEntry { rank: number; userId: string; displayName: string; sharpe: number; isMe: boolean }

export default function GroupDetail() {
  const c = theme.colors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [feed, setFeed] = useState<FeedEvent[] | null>(null);
  const [sentiment, setSentiment] = useState<GroupSentiment[]>([]);
  const [sharpe, setSharpe] = useState<SharpeEntry[]>([]);
  const [name, setName] = useState('Group');

  const load = useCallback(async () => {
    if (!id) return;
    const [lb, fd, sn, sh] = await Promise.all([
      endpoints.leaderboard(id),
      endpoints.feed(id),
      endpoints.groupSentiment(id),
      endpoints.sharpeLeaderboard(id),
    ]);
    setLeaderboard(lb.leaderboard);
    setName(lb.group.name);
    setFeed(fd.events);
    setSentiment(sn.sentiment);
    setSharpe(sh.leaderboard);
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
          options={[
            { key: 'leaderboard', label: 'ROI' },
            { key: 'sharpe', label: 'Sharpe' },
            { key: 'feed', label: 'Feed' },
            { key: 'sentiment', label: 'Sent.' },
          ]}
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
                  <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{e.displayName}{e.isMe ? '  ·  you' : ''}</Text>
                  <Mono style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{formatMoney(e.equity)}</Mono>
                </View>
                <Mono style={{ color: gainColor(e.roi), fontSize: 16, fontWeight: '700' }}>{formatPct(e.roi)}</Mono>
              </View>
              <Hairline inset={20} />
            </View>
          ))}

        {tab === 'sharpe' &&
          (sharpe.length === 0 ? (
            <Text style={{ color: c.muted, padding: 20 }}>The risk leaderboard appears after a few market ticks.</Text>
          ) : (
            sharpe.map((e) => (
              <View key={e.userId}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13 }}>
                  <Text style={{ width: 22, textAlign: 'center', color: e.rank <= 3 ? c.lime : c.faint, fontSize: 16, fontWeight: '700' }}>{e.rank}</Text>
                  <Monogram name={e.displayName} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{e.displayName}{e.isMe ? '  ·  you' : ''}</Text>
                    <Label>risk-adjusted return</Label>
                  </View>
                  <Mono style={{ color: gainColor(e.sharpe), fontSize: 16, fontWeight: '700' }}>{e.sharpe.toFixed(2)}</Mono>
                </View>
                <Hairline inset={20} />
              </View>
            ))
          ))}

        {tab === 'feed' &&
          (feed.length === 0 ? (
            <Text style={{ color: c.muted, padding: 20 }}>No events yet.</Text>
          ) : (
            feed.map((ev) => (
              <View key={ev.id}>
                <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
                  <Text style={{ color: c.text, fontSize: 14 }}>{ev.message}</Text>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, alignItems: 'center' }}>
                    <Pressable onPress={() => react(ev.id)}>
                      <Mono style={{ color: ev.reactions.some((r) => r.reactedByMe) ? c.lime : c.muted, fontSize: 12 }}>
                        REACTIONS {ev.reactions.reduce((s, r) => s + r.count, 0)}
                      </Mono>
                    </Pressable>
                    <Mono style={{ color: c.muted, fontSize: 12 }}>COMMENTS {ev.commentCount}</Mono>
                  </View>
                </View>
                <Hairline inset={20} />
              </View>
            ))
          ))}

        {tab === 'sentiment' &&
          (sentiment.length === 0 ? (
            <Text style={{ color: c.muted, padding: 20 }}>No votes. Mark Bullish/Bearish from "Market".</Text>
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
