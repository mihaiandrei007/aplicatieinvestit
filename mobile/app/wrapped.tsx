import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Label, H1, Mono, Hairline, Loading } from '../src/components/ui';
import { endpoints, type Wrapped } from '../src/api/client';
import { theme, formatMoney, formatPct, gainColor } from '../src/theme';

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  const c = theme.colors;
  return (
    <View style={{ width: '50%', paddingVertical: 14 }}>
      <Label>{label}</Label>
      <Mono style={{ color: color ?? c.text, fontSize: 22, fontWeight: '700', marginTop: 4 }}>{value}</Mono>
    </View>
  );
}

export default function WrappedScreen() {
  const c = theme.colors;
  const [w, setW] = useState<Wrapped | null>(null);
  useEffect(() => { endpoints.wrapped().then(setW); }, []);
  if (!w) return <Loading />;

  const winRate = w.predictions.total > 0 ? `${Math.round(w.predictions.winRate * 100)}%` : '—';

  return (
    <Screen>
      <View style={{ padding: 20, gap: 4 }}>
        <Label>Tickr Wrapped</Label>
        <H1>{w.displayName}</H1>
        <Text style={{ color: c.muted, marginTop: 4 }}>Your summary so far</Text>
      </View>
      <Hairline inset={20} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20 }}>
        <Stat label="Return" value={formatPct(w.roi)} color={gainColor(w.roi)} />
        <Stat label="Capital" value={formatMoney(w.equity)} />
        <Stat label="Trades" value={String(w.tradeCount)} />
        <Stat label="Distinct symbols" value={String(w.distinctSymbols)} />
        <Stat label="Realized P&L" value={formatMoney(w.realizedPnL)} color={gainColor(w.realizedPnL)} />
        <Stat label="Streak" value={`${w.currentStreak} days`} />
        <Stat label="Badges" value={String(w.badges)} />
        <Stat label="Correct predictions" value={`${w.predictions.won}/${w.predictions.total} · ${winRate}`} />
      </View>

      {w.bestHolding && (
        <>
          <Hairline inset={20} />
          <View style={{ padding: 20 }}>
            <Label>Best holding</Label>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{w.bestHolding.symbol}</Text>
              <Mono style={{ color: gainColor(w.bestHolding.unrealizedPnL), fontSize: 18, fontWeight: '700' }}>
                {formatMoney(w.bestHolding.unrealizedPnL)}
              </Mono>
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}
