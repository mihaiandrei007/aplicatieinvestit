import React, { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Title, Subtitle, Card, Field, Button, Loading } from '../../src/components/ui';
import { endpoints, ApiError, type Instrument } from '../../src/api/client';
import { useRealtime } from '../../src/realtime/useRealtime';
import { theme, formatMoney } from '../../src/theme';

export default function MarketScreen() {
  const [instruments, setInstruments] = useState<Instrument[] | null>(null);
  const [selected, setSelected] = useState<Instrument | null>(null);
  const [qty, setQty] = useState('1');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { instruments } = await endpoints.instruments();
    setInstruments(instruments);
  }, []);

  // Prețuri live: actualizează în loc la fiecare PRICE_UPDATE de la server.
  useRealtime({
    onMessage: (msg) => {
      if (msg.type !== 'PRICE_UPDATE') return;
      const changes = msg.payload as Array<{ symbol: string; next: number }>;
      const map = new Map(changes.map((c) => [c.symbol, c.next]));
      setInstruments((prev) =>
        prev ? prev.map((i) => (map.has(i.symbol) ? { ...i, currentPrice: map.get(i.symbol)! } : i)) : prev,
      );
    },
  });

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function trade(side: 'BUY' | 'SELL') {
    if (!selected) return;
    const quantity = Number(qty);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      Alert.alert('Cantitate invalidă', 'Introdu un număr pozitiv.');
      return;
    }
    setBusy(true);
    try {
      const res = await endpoints.trade(selected.symbol, side, quantity);
      const badges = res.newBadges?.map((b) => b.label).join(', ');
      Alert.alert(
        side === 'BUY' ? 'Cumpărare reușită' : 'Vânzare reușită',
        `Numerar rămas: ${formatMoney(res.cash)}` + (badges ? `\n🏅 Insigne noi: ${badges}` : ''),
      );
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
    <Screen>
      <Title>Piață</Title>
      <Subtitle>Prețuri simulate. Apasă pe un instrument ca să tranzacționezi.</Subtitle>

      {instruments.map((i) => (
        <Pressable key={i.id} onPress={() => setSelected(i)}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '700' }}>{i.symbol}</Text>
                <Text style={{ color: theme.colors.muted }}>{i.name}</Text>
              </View>
              <Text style={{ color: theme.colors.text, fontSize: 18 }}>{formatMoney(i.currentPrice)}</Text>
            </View>
          </Card>
        </Pressable>
      ))}

      {selected && (
        <Card>
          <Subtitle>
            Tranzacționează {selected.symbol} la {formatMoney(selected.currentPrice)}
          </Subtitle>
          <Field label="Cantitate" value={qty} onChangeText={setQty} keyboardType="numeric" />
          <View style={{ flexDirection: 'row', gap: theme.spacing(1) }}>
            <View style={{ flex: 1 }}>
              <Button title="Cumpără" onPress={() => trade('BUY')} loading={busy} />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Vinde" variant="danger" onPress={() => trade('SELL')} loading={busy} />
            </View>
          </View>
          <Button title="Anulează" variant="ghost" onPress={() => setSelected(null)} />
        </Card>
      )}
    </Screen>
  );
}
