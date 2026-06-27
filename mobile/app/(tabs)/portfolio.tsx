import React, { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Title, Subtitle, Card, Button, Loading } from '../../src/components/ui';
import { endpoints, type PortfolioSnapshot, type EquityPoint, type StreakState } from '../../src/api/client';
import { useAuth } from '../../src/auth/AuthContext';
import { EquityChart } from '../../src/components/EquityChart';
import { theme, formatMoney, formatPct } from '../../src/theme';

export default function PortfolioScreen() {
  const { user, signOut } = useAuth();
  const [data, setData] = useState<PortfolioSnapshot | null>(null);
  const [history, setHistory] = useState<EquityPoint[]>([]);
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [snapshot, hist, st] = await Promise.all([
        endpoints.portfolio(),
        endpoints.history(),
        endpoints.streak(),
      ]);
      setData(snapshot);
      setHistory(hist.history);
      setStreak(st);
    } finally {
      setRefreshing(false);
    }
  }, []);

  async function checkIn() {
    setCheckingIn(true);
    try {
      const r = await endpoints.checkIn();
      if (r.alreadyCheckedIn) {
        Alert.alert('Deja făcut', 'Ai făcut deja check-in azi. Revino mâine!');
      } else {
        const extra = r.earnedFreeze ? '\n❄️ Ai câștigat un streak freeze!' : '';
        Alert.alert('Check-in reușit 🔥', `Streak: ${r.currentStreak} zile\n+${r.creditsGranted} credite de tranzacționare${extra}`);
      }
      await load();
    } finally {
      setCheckingIn(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!data) return <Loading />;

  const roi = (data.equity - data.startingCash) / data.startingCash;
  const roiColor = roi >= 0 ? theme.colors.green : theme.colors.red;

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={{ gap: theme.spacing(2) }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={theme.colors.primary} />}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title>Salut, {user?.displayName} 👋</Title>
        </View>

        {streak && (
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '700' }}>
                  🔥 Streak: {streak.currentStreak} {streak.currentStreak === 1 ? 'zi' : 'zile'}
                </Text>
                <Text style={{ color: theme.colors.muted, fontSize: 13 }}>
                  🎟️ {streak.tradeCredits} credite · ❄️ {streak.freezes} freeze
                </Text>
              </View>
              <View style={{ width: 130 }}>
                <Button
                  title={streak.checkedInToday ? 'Revino mâine' : 'Check-in zilnic'}
                  onPress={checkIn}
                  loading={checkingIn}
                  disabled={streak.checkedInToday}
                  variant={streak.checkedInToday ? 'ghost' : 'primary'}
                />
              </View>
            </View>
          </Card>
        )}

        <Card>
          <Subtitle>Capital total (equity)</Subtitle>
          <Text style={{ color: theme.colors.text, fontSize: 34, fontWeight: '800' }}>{formatMoney(data.equity)}</Text>
          <Text style={{ color: roiColor, fontSize: 16, fontWeight: '700' }}>{formatPct(roi)} randament</Text>
          {history.length >= 2 && (
            <View style={{ marginTop: 8 }}>
              <EquityChart values={history.map((h) => h.equity)} baseline={data.startingCash} />
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: theme.spacing(2), marginTop: 8 }}>
            <Stat label="Numerar" value={formatMoney(data.cash)} />
            <Stat label="P&L nerealizat" value={formatMoney(data.unrealizedPnL)} />
          </View>
        </Card>

        <Subtitle>Dețineri</Subtitle>
        {data.holdings.length === 0 ? (
          <Card>
            <Text style={{ color: theme.colors.muted }}>Nu deții încă nimic. Mergi la „Piață" ca să cumperi.</Text>
          </Card>
        ) : (
          data.holdings.map((h) => {
            const pnlColor = h.unrealizedPnL >= 0 ? theme.colors.green : theme.colors.red;
            return (
              <Card key={h.symbol}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>{h.symbol}</Text>
                  <Text style={{ color: theme.colors.text, fontSize: 16 }}>{formatMoney(h.marketValue)}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.colors.muted }}>
                    {h.quantity} buc · cost mediu {formatMoney(h.avgCost)}
                  </Text>
                  <Text style={{ color: pnlColor }}>{formatMoney(h.unrealizedPnL)}</Text>
                </View>
              </Card>
            );
          })
        )}

        <Button title="Ieși din cont" variant="ghost" onPress={signOut} />
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
