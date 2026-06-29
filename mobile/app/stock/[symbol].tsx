import React, { useCallback, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Screen, Label, Mono, Hairline, Button, Segmented, Loading } from '../../src/components/ui';
import { Caret, EquitySparkline } from '../../src/components/icons';
import { endpoints, ApiError, type InstrumentDetail, type Holding, type SentimentValue } from '../../src/api/client';
import { useRealtime } from '../../src/realtime/useRealtime';
import { theme, formatMoney, formatPct, gainColor } from '../../src/theme';

const W = Dimensions.get('window').width;

export default function StockDetail() {
  const c = theme.colors;
  const symbol = String(useLocalSearchParams().symbol ?? '').toUpperCase();
  const [detail, setDetail] = useState<InstrumentDetail | null>(null);
  const [points, setPoints] = useState<number[]>([]);
  const [price, setPrice] = useState(0);
  const [holding, setHolding] = useState<Holding | null>(null);
  const [qty, setQty] = useState(10);
  const [stance, setStance] = useState<SentimentValue>('BULLISH');
  const [predStake, setPredStake] = useState('100');
  const [multiplier, setMultiplier] = useState(1.9);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [d, pf, rules] = await Promise.all([
      endpoints.instrumentDetail(symbol),
      endpoints.portfolio(),
      endpoints.predictionRules(),
    ]);
    setDetail(d);
    setPoints(d.points.map((p) => p.price));
    setPrice(d.instrument.currentPrice);
    setMultiplier(rules.multiplier);
    setHolding(pf.holdings.find((h) => h.symbol === symbol) ?? null);
  }, [symbol]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useRealtime({
    onMessage: (msg) => {
      if (msg.type !== 'PRICE_UPDATE') return;
      const ch = (msg.payload as Array<{ symbol: string; next: number }>).find((x) => x.symbol === symbol);
      if (ch) {
        setPrice(ch.next);
        setPoints((p) => [...p, ch.next].slice(-90));
      }
    },
  });

  async function doTrade(side: 'BUY' | 'SELL', quantity: number) {
    if (quantity <= 0) return;
    setBusy(true);
    try {
      const res = await endpoints.trade(symbol, side, quantity);
      Alert.alert(side === 'BUY' ? 'Buy successful' : 'Sell successful', `Cash: ${formatMoney(res.cash)} · Credits: ${res.tradeCredits}`);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Trade failed.');
    } finally {
      setBusy(false);
    }
  }

  async function setSentiment(value: SentimentValue) {
    setStance(value);
    await endpoints.setSentiment(symbol, value).catch(() => {});
  }

  async function predict(direction: 'UP' | 'DOWN') {
    const stake = Number(predStake);
    if (!Number.isFinite(stake) || stake <= 0) {
      Alert.alert('Invalid stake', 'Enter a positive amount.');
      return;
    }
    setBusy(true);
    try {
      await endpoints.placePrediction(symbol, direction, stake);
      Alert.alert('Prediction placed', `${symbol} ${direction}, stake ${formatMoney(stake)}. Resolves at the next tick (×${multiplier}).`);
    } catch (e) {
      Alert.alert('Error', e instanceof ApiError ? e.message : 'Prediction failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!detail) return <Loading />;
  const first = points[0] ?? price;
  const chg = first > 0 ? (price - first) / first : 0;
  const series = points.length >= 2 ? points : [price, price];

  return (
    <Screen scroll={false}>
      <Stack.Screen options={{ title: symbol }} />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{detail.instrument.name}</Text>
          <Label style={{ marginTop: 3 }}>{symbol}{detail.instrument.sector ? ` · ${detail.instrument.sector}` : ''}</Label>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 }}>
            <Mono style={{ fontSize: 34, fontWeight: '600', letterSpacing: -1 }}>{formatMoney(price)}</Mono>
            <Text style={{ color: c.muted, fontSize: 14, marginLeft: 6, marginBottom: 4 }}>RON</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Caret up={chg >= 0} color={gainColor(chg)} />
            <Mono style={{ color: gainColor(chg), fontSize: 13, fontWeight: '700' }}>{formatPct(chg)}</Mono>
            <Label>recent</Label>
          </View>
        </View>

        {/* chart */}
        <View style={{ marginTop: 14 }}>
          <EquitySparkline values={series} width={W} height={170} color={gainColor(chg)} />
        </View>
        <Hairline inset={20} />

        {/* your position */}
        {holding && holding.quantity > 0 && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13 }}>
              <View>
                <Label>You own</Label>
                <Mono style={{ fontSize: 15, fontWeight: '600', marginTop: 3 }}>{holding.quantity} sh · {formatMoney(holding.marketValue)}</Mono>
                <Mono style={{ color: gainColor(holding.unrealizedPnL), fontSize: 11, marginTop: 2 }}>{formatMoney(holding.unrealizedPnL)} P&L</Mono>
              </View>
              <Pressable onPress={() => doTrade('SELL', holding.quantity)} disabled={busy} style={{ borderWidth: 1, borderColor: c.red, borderRadius: 6, paddingHorizontal: 16, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.red, fontWeight: '700', letterSpacing: 0.5 }}>SELL ALL</Text>
              </Pressable>
            </View>
            <Hairline inset={20} />
          </>
        )}

        {/* trade module */}
        <View style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Trade</Label>
            <View style={{ width: 150 }}>
              <Segmented
                options={[{ key: 'BULLISH', label: 'Bullish' }, { key: 'BEARISH', label: 'Bearish' }]}
                value={stance}
                onChange={(k) => setSentiment(k as SentimentValue)}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingLeft: 14, height: 48 }}>
            <View style={{ flex: 1 }}>
              <Label>Quantity · est. {formatMoney(qty * price)}</Label>
              <Mono style={{ fontSize: 18, fontWeight: '600' }}>{qty}</Mono>
            </View>
            <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 40, height: 46, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: c.lime, fontSize: 22, fontWeight: '600' }}>−</Text>
            </Pressable>
            <Pressable onPress={() => setQty((q) => q + 1)} style={{ width: 40, height: 46, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: c.lime, fontSize: 22, fontWeight: '600' }}>+</Text>
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Button title="BUY" onPress={() => doTrade('BUY', qty)} loading={busy} /></View>
            <View style={{ flex: 1 }}><Button title="SELL" variant="ghost" onPress={() => doTrade('SELL', qty)} loading={busy} /></View>
          </View>

          {/* quick prediction */}
          <View style={{ borderTopWidth: 1, borderTopColor: c.hair, paddingTop: 12, gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Label>Quick prediction · ×{multiplier}</Label>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingHorizontal: 10, height: 32 }}>
                <Label>Stake</Label>
                <TextInput value={predStake} onChangeText={setPredStake} keyboardType="numeric" style={{ color: c.text, fontSize: 14, minWidth: 50, padding: 0, fontVariant: ['tabular-nums'] }} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => predict('UP')} disabled={busy} style={{ flex: 1, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: c.lime }}>
                <Caret up color={c.lime} size={9} />
                <Text style={{ color: c.lime, fontWeight: '700', letterSpacing: 0.5 }}>UP</Text>
              </Pressable>
              <Pressable onPress={() => predict('DOWN')} disabled={busy} style={{ flex: 1, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: c.red }}>
                <Caret up={false} color={c.red} size={9} />
                <Text style={{ color: c.red, fontWeight: '700', letterSpacing: 0.5 }}>DOWN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
