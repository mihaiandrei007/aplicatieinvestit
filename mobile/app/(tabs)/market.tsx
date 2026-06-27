import React, { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Label, H1, Mono, Hairline, SymbolTile, Button, Segmented, Loading } from '../../src/components/ui';
import { Caret, IconSearch } from '../../src/components/icons';
import { endpoints, ApiError, type Instrument, type SentimentValue, type NewsItem } from '../../src/api/client';
import { useRealtime } from '../../src/realtime/useRealtime';
import { theme, formatMoney, gainColor } from '../../src/theme';

export default function MarketScreen() {
  const c = theme.colors;
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[] | null>(null);
  const [prev, setPrev] = useState<Record<string, number>>({});
  const [news, setNews] = useState<NewsItem[]>([]);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [onlyWatched, setOnlyWatched] = useState(false);
  const [selected, setSelected] = useState<Instrument | null>(null);
  const [qty, setQty] = useState(10);
  const [stance, setStance] = useState<SentimentValue>('BULLISH');
  const [busy, setBusy] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [predStake, setPredStake] = useState('100');
  const [multiplier, setMultiplier] = useState(1.9);

  const load = useCallback(async () => {
    const [{ instruments }, st, nw, rules, wl] = await Promise.all([
      endpoints.instruments(),
      endpoints.streak(),
      endpoints.news(),
      endpoints.predictionRules(),
      endpoints.watchlist(),
    ]);
    setInstruments(instruments);
    setCredits(st.tradeCredits);
    setNews(nw.news);
    setMultiplier(rules.multiplier);
    setWatched(new Set(wl.symbols));
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
      if (msg.type === 'PREDICTION_RESOLVED') {
        const r = msg.payload as { symbol: string; direction: string; won: boolean; stake: number; payout: number };
        Alert.alert(
          r.won ? 'Predicție câștigată' : 'Predicție pierdută',
          r.won
            ? `${r.symbol} ${r.direction === 'UP' ? 'SUS' : 'JOS'}: ai câștigat ${formatMoney(r.payout)} (miză ${formatMoney(r.stake)}).`
            : `${r.symbol} ${r.direction === 'UP' ? 'SUS' : 'JOS'}: ai pierdut miza de ${formatMoney(r.stake)}.`,
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

  async function setSentiment(value: SentimentValue) {
    setStance(value);
    if (selected) await endpoints.setSentiment(selected.symbol, value).catch(() => {});
  }

  async function toggleWatch(symbol: string) {
    try {
      const r = await endpoints.toggleWatch(symbol);
      setWatched((prev) => {
        const n = new Set(prev);
        if (r.watching) n.add(symbol); else n.delete(symbol);
        return n;
      });
    } catch {
      // ignoră
    }
  }

  async function predict(direction: 'UP' | 'DOWN') {
    if (!selected) return;
    const stake = Number(predStake);
    if (!Number.isFinite(stake) || stake <= 0) {
      Alert.alert('Miză invalidă', 'Introdu o sumă pozitivă.');
      return;
    }
    setBusy(true);
    try {
      await endpoints.placePrediction(selected.symbol, direction, stake);
      Alert.alert(
        'Predicție plasată',
        `${selected.symbol} ${direction === 'UP' ? 'SUS' : 'JOS'}, miză ${formatMoney(stake)}. Se rezolvă la următorul tick (×${multiplier}).`,
      );
    } catch (e) {
      Alert.alert('Eroare', e instanceof ApiError ? e.message : 'Predicție eșuată.');
    } finally {
      setBusy(false);
    }
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
            <Pressable onPress={() => router.push('/news')}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 }}>
                <Label>Știri de piață</Label>
                <Text style={{ color: c.lime, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>VEZI TOATE ›</Text>
              </View>
            </Pressable>
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

        {/* filtre */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 10 }}>
          {[{ k: false, l: 'Toate' }, { k: true, l: 'Urmărite' }].map((f) => (
            <Pressable key={f.l} onPress={() => setOnlyWatched(f.k)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, borderWidth: 1, borderColor: onlyWatched === f.k ? c.lime : c.border, backgroundColor: onlyWatched === f.k ? c.lime : 'transparent' }}>
              <Text style={{ color: onlyWatched === f.k ? c.limeInk : c.muted2, fontSize: 11, fontWeight: '700' }}>{f.l}</Text>
            </Pressable>
          ))}
        </View>

        {/* column head */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8, gap: 10 }}>
          <Text style={{ flex: 1, color: c.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Simbol</Text>
          <Text style={{ width: 78, textAlign: 'right', color: c.faint, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>Preț · 24h</Text>
          <View style={{ width: 24 }} />
        </View>
        <Hairline inset={20} />

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {instruments.filter((i) => !onlyWatched || watched.has(i.symbol)).map((i) => {
            const base = prev[i.symbol] ?? i.currentPrice;
            const chg = base ? (i.currentPrice - base) / base : 0;
            const sel = selected?.symbol === i.symbol;
            const star = watched.has(i.symbol);
            return (
              <View key={i.id}>
                <Pressable onPress={() => setSelected(i)} style={{ backgroundColor: sel ? c.surface : 'transparent' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, gap: 10 }}>
                    <SymbolTile symbol={i.symbol} accent={sel} />
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

            {/* Predicție rapidă (semi-gambling tematic) */}
            <View style={{ borderTopWidth: 1, borderTopColor: c.hair, paddingTop: 12, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Label>Predicție rapidă · ×{multiplier}</Label>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: c.border, borderRadius: 6, paddingHorizontal: 10, height: 32 }}>
                  <Label>Miză</Label>
                  <TextInput
                    value={predStake}
                    onChangeText={setPredStake}
                    keyboardType="numeric"
                    style={{ color: c.text, fontSize: 14, minWidth: 50, padding: 0, fontVariant: ['tabular-nums'] }}
                  />
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable onPress={() => predict('UP')} disabled={busy} style={{ flex: 1, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: c.lime }}>
                  <Caret up color={c.lime} size={9} />
                  <Text style={{ color: c.lime, fontWeight: '700', letterSpacing: 0.5 }}>SUS</Text>
                </Pressable>
                <Pressable onPress={() => predict('DOWN')} disabled={busy} style={{ flex: 1, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: c.red }}>
                  <Caret up={false} color={c.red} size={9} />
                  <Text style={{ color: c.red, fontWeight: '700', letterSpacing: 0.5 }}>JOS</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
