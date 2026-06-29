import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Label, H1, Mono, Hairline, SymbolTile, Loading } from '../../src/components/ui';
import { Caret, IconSearch } from '../../src/components/icons';
import { endpoints, type Instrument } from '../../src/api/client';
import { useRealtime } from '../../src/realtime/useRealtime';
import { theme, formatMoney, gainColor } from '../../src/theme';

export default function MarketScreen() {
  const c = theme.colors;
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[] | null>(null);
  const [prev, setPrev] = useState<Record<string, number>>({});
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [onlyWatched, setOnlyWatched] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [{ instruments }, st, wl] = await Promise.all([
      endpoints.instruments(),
      endpoints.streak(),
      endpoints.watchlist(),
    ]);
    setInstruments(instruments);
    setCredits(st.tradeCredits);
    setWatched(new Set(wl.symbols));
    setPrev((p) => {
      const next = { ...p };
      for (const i of instruments) if (next[i.symbol] === undefined) next[i.symbol] = i.currentPrice;
      return next;
    });
  }, []);

  useRealtime({
    onMessage: (msg) => {
      if (msg.type === 'PREDICTION_RESOLVED') {
        const r = msg.payload as { symbol: string; direction: string; won: boolean; stake: number; payout: number };
        Alert.alert(
          r.won ? 'Prediction won' : 'Prediction lost',
          r.won
            ? `${r.symbol} ${r.direction}: you won ${formatMoney(r.payout)} (stake ${formatMoney(r.stake)}).`
            : `${r.symbol} ${r.direction}: you lost the stake of ${formatMoney(r.stake)}.`,
        );
        return;
      }
      if (msg.type !== 'PRICE_UPDATE') return;
      const changes = msg.payload as Array<{ symbol: string; prev: number; next: number }>;
      const map = new Map(changes.map((x) => [x.symbol, x]));
      setInstruments((cur) => (cur ? cur.map((i) => (map.has(i.symbol) ? { ...i, currentPrice: map.get(i.symbol)!.next } : i)) : cur));
      setPrev((p) => { const n = { ...p }; for (const x of changes) n[x.symbol] = x.prev; return n; });
    },
  });

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function toggleWatch(symbol: string) {
    try {
      const r = await endpoints.toggleWatch(symbol);
      setWatched((prev) => {
        const n = new Set(prev);
        if (r.watching) n.add(symbol); else n.delete(symbol);
        return n;
      });
    } catch {
      // ignore
    }
  }

  if (!instruments) return <Loading />;
  const list = instruments.filter((i) => !onlyWatched || watched.has(i.symbol));

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1 }}>
        {/* header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
          <View>
            <Label>Market open{credits !== null ? ` · ${credits} credits` : ''}</Label>
            <View style={{ marginTop: 5 }}><H1>Instruments</H1></View>
          </View>
          <View style={{ width: 34, height: 34, borderWidth: 1, borderColor: c.border, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }}>
            <IconSearch color={c.muted2} />
          </View>
        </View>

        <Hairline inset={20} />

        {/* filters */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 10 }}>
          {[{ k: false, l: 'All' }, { k: true, l: 'Watchlist' }].map((f) => (
            <Pressable key={f.l} onPress={() => setOnlyWatched(f.k)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: onlyWatched === f.k ? c.lime : c.border, backgroundColor: onlyWatched === f.k ? c.lime : 'transparent' }}>
              <Text style={{ color: onlyWatched === f.k ? c.limeInk : c.muted2, fontSize: 11, fontWeight: '700' }}>{f.l}</Text>
            </Pressable>
          ))}
        </View>

        {/* column head */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8, gap: 10 }}>
          <Text style={{ flex: 1, color: c.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Symbol</Text>
          <Text style={{ width: 78, textAlign: 'right', color: c.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Price · 24h</Text>
          <View style={{ width: 24 }} />
        </View>
        <Hairline inset={20} />

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {list.map((i) => {
            const base = prev[i.symbol] ?? i.currentPrice;
            const chg = base ? (i.currentPrice - base) / base : 0;
            const star = watched.has(i.symbol);
            return (
              <View key={i.id}>
                <Pressable onPress={() => router.push(`/stock/${i.symbol}`)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 10 }}>
                    <SymbolTile symbol={i.symbol} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{i.name}</Text>
                      <Text style={{ color: c.muted, fontSize: 11, marginTop: 2, letterSpacing: 0.5 }}>{i.sector ?? i.currency}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', width: 78 }}>
                      <Mono style={{ fontSize: 14, fontWeight: '600' }}>{formatMoney(i.currentPrice)}</Mono>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Caret up={chg >= 0} color={gainColor(chg)} />
                        <Mono style={{ color: gainColor(chg), fontSize: 12, fontWeight: '700' }}>{(chg * 100).toFixed(2)}%</Mono>
                      </View>
                    </View>
                    <Pressable onPress={() => toggleWatch(i.symbol)} hitSlop={8} style={{ width: 24, alignItems: 'center' }}>
                      <Text style={{ color: star ? c.lime : c.faint, fontSize: 18 }}>{star ? '★' : '☆'}</Text>
                    </Pressable>
                  </View>
                </Pressable>
                <Hairline inset={20} />
              </View>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </Screen>
  );
}
