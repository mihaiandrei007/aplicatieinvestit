import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Label, H1, Mono, Hairline, SymbolTile, Button, Segmented, Loading } from '../../src/components/ui';
import { Caret, IconSearch } from '../../src/components/icons';
import { endpoints, ApiError, type Instrument, type SentimentValue, type NewsItem } from '../../src/api/client';
import { useRealtime } from '../../src/realtime/useRealtime';
import { theme, formatMoney, gainColor } from '../../src/theme';

export default function MarketScreen() {
  const c = theme.colors;
  const [instruments, setInstruments] = useState<Instrument[] | null>(null);
  const [prev, setPrev] = useState<Record<string, number>>({});
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selected, setSelected] = useState<Instrument | null>(null);
  const [qty, setQty] = useState(10);
  const [stance, setStance] = useState<SentimentValue>('BULLISH');
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [{ instruments }, st, nw] = await Promise.all([endpoints.instruments(), endpoints.streak(), endpoints.news()]);
    setInstruments(instruments);
    setCredits(st.tradeCredits);
    setNews(nw.news);
    setPrev((p) => {
      const next = { ...p };
      for (const i of instruments) if (next[i.symbol] === undefined) next[i.symbol] = i.currentPrice;
      return next;
    });
  }, []);

  useRealtime({
    onMessage: (msg) => {
      if (msg.type === 'NEWS') {
        const n = msg.payload as { symbol: string | null; headline: string; body: string; source: string };
        setNews((cur) => [{ id: `${Date.now()}`, createdAt: new Date().toISOString(), ...n }, ...cur].slice(0, 30));
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

  async function setSentiment(value: SentimentValue) {
    setStance(value);
    if (selected) await endpoints.setSentiment(selected.symbol, value).catch(() => {});
  }

  async function trade(side: 'BUY' | 'SELL') {
    if (!selected || qty <= 0) return;
    setBusy(true);
    try {
      const res = await endpoints.trade(selected.symbol, side, qty);
      setCredits(res.tradeCredits);
      Alert.alert(side === 'BUY' ? 'Cumpărare reușită' : 'Vânzare reușită', `Numerar: ${formatMoney(res.cash)} · Credite: ${res.tradeCredits}`);
      setSelected(null);
      load();
    } catch (e) {
      Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Tranzacție eșuată.');
    } finally {
      setBusy(false);
    }
  }

  if (!instruments) return <Loading />;

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1 }}>
        {/* header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
          <View>
            <Label>Piață deschisă{credits !== null ? ` · ${credits} credite` : ''}</Label>
            <View style={{ marginTop: 5 }}><H1>Instrumente</H1></View>
          </View>
          <View style={{ width: 34, height: 34, borderWidth: 1, borderColor: c.border, borderRadius: 5, alignItems: 'center', justifyContent: 'center' }}>
            <IconSearch color={c.muted2} />
          </View>
        </View>

        {/* news strip */}
        {news.length > 0 && (
          <>
            <Hairline inset={20} />
            <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
              <Label>Știri de piață</Label>
            </View>
            {news.slice(0, 3).map((n) => (
              <Pressable key={n.id} onPress={() => Alert.alert(n.headline, `${n.source ? n.source + '\n\n' : ''}${n.body}`)}>
                <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 8 }}>
                  {n.symbol ? <SymbolTile symbol={n.symbol} size={30} /> : null}
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={{ color: c.text, fontSize: 13, fontWeight: '600' }}>{n.headline}</Text>
                    {!!n.source && <Label style={{ marginTop: 3 }}>{n.source}</Label>}
                  </View>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {/* column head */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8 }}>
          <Text style={{ flex: 1, color: c.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Simbol</Text>
          <Text style={{ width: 78, textAlign: 'right', color: c.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Preț</Text>
          <Text style={{ width: 76, textAlign: 'right', color: c.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Variație</Text>
        </View>
        <Hairline inset={20} />

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {instruments.map((i) => {
            const base = prev[i.symbol] ?? i.currentPrice;
            const chg = base ? (i.currentPrice - base) / base : 0;
            const sel = selected?.symbol === i.symbol;
            return (
              <View key={i.id}>
                <Pressable onPress={() => setSelected(i)} style={{ backgroundColor: sel ? c.surface : 'transparent' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 10 }}>
                    <SymbolTile symbol={i.symbol} accent={sel} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>{i.name}</Text>
                      <Mono style={{ color: c.muted, fontSize: 11, marginTop: 2 }}>{i.currency}</Mono>
                    </View>
                    <Mono style={{ width: 78, textAlign: 'right', fontSize: 14, fontWeight: '600' }}>{formatMoney(i.currentPrice)}</Mono>
                    <View style={{ width: 76, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
                      <Caret up={chg >= 0} color={gainColor(chg)} />
                      <Mono style={{ color: gainColor(chg), fontSize: 12, fontWeight: '700' }}>{(chg * 100).toFixed(2)}%</Mono>
                    </View>
                  </View>
                </Pressable>
                <Hairline inset={20} />
              </View>
            );
          })}
        </ScrollView>

        {/* trade module */}
        {selected && (
          <View style={{ backgroundColor: c.surfaceAlt, borderTopWidth: 1, borderTopColor: c.border, padding: 20, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>
                {selected.symbol} <Text style={{ color: c.muted, fontWeight: '400' }}>· {formatMoney(selected.currentPrice)} RON</Text>
              </Text>
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
                <Label>Cantitate · est. {formatMoney(qty * selected.currentPrice)}</Label>
                <Mono style={{ fontSize: 18, fontWeight: '600' }}>{qty}</Mono>
              </View>
              <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 38, height: 46, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.lime, fontSize: 22, fontWeight: '600' }}>−</Text>
              </Pressable>
              <Pressable onPress={() => setQty((q) => q + 1)} style={{ width: 38, height: 46, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.lime, fontSize: 22, fontWeight: '600' }}>+</Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Button title="CUMPĂRĂ" onPress={() => trade('BUY')} loading={busy} /></View>
              <View style={{ flex: 1 }}><Button title="VINDE" variant="ghost" onPress={() => trade('SELL')} loading={busy} /></View>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
