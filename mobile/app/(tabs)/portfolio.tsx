import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Label, Mono, Hairline, SymbolTile, Loading } from '../../src/components/ui';
import { Caret, EquitySparkline } from '../../src/components/icons';
import { endpoints, type PortfolioSnapshot, type EquityPoint, type StreakState, type DailyChallenge } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { theme, formatMoney, formatPct, gainColor, initials } from '../../src/theme';

const W = Dimensions.get('window').width;

export default function PortfolioScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<PortfolioSnapshot | null>(null);
  const [history, setHistory] = useState<EquityPoint[]>([]);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [daily, setDaily] = useState<DailyChallenge | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [snap, hist, st, dc] = await Promise.all([
        endpoints.portfolio(),
        endpoints.history(),
        endpoints.streak(),
        endpoints.daily(),
      ]);
      setData(snap);
      setHistory(hist.history);
      setStreak(st);
      setDaily(dc);
    } finally {
      setRefreshing(false);
    }
  }, []);

  async function voteDaily(direction: 'UP' | 'DOWN') {
    try {
      setDaily(await endpoints.voteDaily(direction));
    } catch (e) {
      Alert.alert('Provocare', e instanceof Error ? e.message : 'Vot eșuat.');
    }
  }

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function checkIn() {
    setCheckingIn(true);
    try {
      const r = await endpoints.checkIn();
      Alert.alert(
        r.alreadyCheckedIn ? 'Deja făcut' : 'Check-in reușit',
        r.alreadyCheckedIn ? 'Revino mâine.' : `Streak ${r.currentStreak} zile · +${r.creditsGranted} credite`,
      );
      await load();
    } finally {
      setCheckingIn(false);
    }
  }

  if (!data) return <Loading />;

  const roi = (data.equity - data.startingCash) / data.startingCash;
  const pnl = data.equity - data.startingCash;
  const c = theme.colors;
  const series = history.length >= 2 ? history.map((h) => h.equity) : [data.startingCash, data.equity];

  return (
    <Screen scroll={false}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={c.lime} />}
      >
        {/* top bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 6 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <View style={{ width: 5, height: 5, backgroundColor: c.lime, borderRadius: 1 }} />
              <Text style={{ color: c.muted2, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>Bursa noastră</Text>
            </View>
            <Text style={{ color: c.faint, fontSize: 11, marginTop: 6 }}>Portofoliu virtual · {user?.displayName}</Text>
          </View>
          <Pressable onPress={() => router.push('/profile')} style={{ width: 32, height: 32, borderWidth: 1, borderColor: c.borderHi, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.lime, fontSize: 11, fontWeight: '700' }}>{initials(user?.displayName ?? '')}</Text>
          </Pressable>
        </View>

        {/* provocarea zilnică (#13) */}
        {daily && (
          <View style={{ marginHorizontal: 20, marginTop: 14, borderWidth: 1, borderColor: c.lime + '55', borderRadius: 8, padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label>Provocarea zilei · +{daily.reward.cash}$ +{daily.reward.credits}cr</Label>
              <Mono style={{ color: c.muted, fontSize: 11 }}>{daily.votesUp}↑ / {daily.votesDown}↓</Mono>
            </View>
            <Text style={{ color: c.text, fontSize: 15, fontWeight: '700', marginTop: 6 }}>
              {daily.name} ({daily.symbol}) — sus sau jos azi?
            </Text>
            {daily.myDirection ? (
              <Text style={{ color: c.lime, fontSize: 12, marginTop: 8, fontWeight: '700' }}>
                Ai votat: {daily.myDirection === 'UP' ? 'SUS' : 'JOS'} · revino mâine pentru rezultat
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Pressable onPress={() => voteDaily('UP')} style={{ flex: 1, height: 40, borderRadius: 6, borderWidth: 1, borderColor: c.lime, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.lime, fontWeight: '700' }}>SUS</Text>
                </Pressable>
                <Pressable onPress={() => voteDaily('DOWN')} style={{ flex: 1, height: 40, borderRadius: 6, borderWidth: 1, borderColor: c.red, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.red, fontWeight: '700' }}>JOS</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* equity */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Label>Valoare portofoliu</Label>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 9 }}>
            <Mono style={{ fontSize: 42, fontWeight: '600', letterSpacing: -1.5, lineHeight: 44 }}>
              {formatMoney(data.equity).split(',')[0]}
              <Text style={{ color: c.muted }}>,{formatMoney(data.equity).split(',')[1]}</Text>
            </Mono>
            <Text style={{ color: c.muted, fontSize: 16, marginLeft: 6, marginBottom: 5 }}>RON</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Caret up={pnl >= 0} color={gainColor(pnl)} />
              <Mono style={{ color: gainColor(pnl), fontSize: 13, fontWeight: '600' }}>{formatMoney(pnl)}</Mono>
            </View>
            <View style={{ width: 1, height: 13, backgroundColor: c.hair }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Mono style={{ color: gainColor(roi), fontSize: 13, fontWeight: '600' }}>{formatPct(roi)}</Mono>
              <Label>ROI</Label>
            </View>
          </View>
        </View>

        {/* chart */}
        <View style={{ marginTop: 14 }}>
          <EquitySparkline values={series} width={W} height={140} color={c.lime} />
        </View>

        {/* streak / credits strip */}
        {streak && (
          <Pressable onPress={checkIn} disabled={checkingIn}>
            <Hairline inset={20} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13 }}>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <View><Label>Streak</Label><Mono style={{ fontSize: 15, fontWeight: '600', marginTop: 3 }}>{streak.currentStreak} zile</Mono></View>
                <View><Label>Credite</Label><Mono style={{ fontSize: 15, fontWeight: '600', marginTop: 3 }}>{streak.tradeCredits}</Mono></View>
              </View>
              <Text style={{ color: streak.checkedInToday ? c.faint : c.lime, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                {streak.checkedInToday ? 'Revino mâine' : 'Check-in ▸'}
              </Text>
            </View>
          </Pressable>
        )}

        {/* holdings */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 9 }}>
          <Label>Dețineri · {data.holdings.length} poziții</Label>
          <Label>Valoare / P&L</Label>
        </View>
        <Hairline inset={20} />

        {data.holdings.length === 0 ? (
          <Text style={{ color: c.muted, paddingHorizontal: 20, paddingVertical: 18 }}>Nicio deținere. Mergi la „Piață".</Text>
        ) : (
          data.holdings.map((h) => {
            const pl = h.unrealizedPnL / (h.avgCost * h.quantity || 1);
            return (
              <View key={h.symbol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 11, gap: 10 }}>
                  <SymbolTile symbol={h.symbol} accent={h.unrealizedPnL >= 0} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{h.symbol}</Text>
                    <Mono style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{h.quantity} buc · {formatMoney(h.avgCost)}</Mono>
                  </View>
                  <Mono style={{ fontSize: 14, fontWeight: '600' }}>{formatMoney(h.marketValue)}</Mono>
                  <Mono style={{ color: gainColor(h.unrealizedPnL), fontSize: 12, fontWeight: '600', minWidth: 60, textAlign: 'right' }}>
                    {formatPct(pl)}
                  </Mono>
                </View>
                <Hairline inset={20} />
              </View>
            );
          })
        )}

        {/* cash */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 13 }}>
          <Label>Numerar disponibil</Label>
          <Mono style={{ color: c.muted2, fontSize: 14, fontWeight: '600' }}>{formatMoney(data.cash)}</Mono>
        </View>

      </ScrollView>
    </Screen>
  );
}
