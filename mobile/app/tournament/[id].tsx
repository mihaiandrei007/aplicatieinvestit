import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Screen, Label, Mono, Hairline, Monogram, Loading } from '../../src/components/ui';
import { endpoints, type TournamentEntry } from '../../src/api/client';
import { theme, formatMoney, formatPct, gainColor } from '../../src/theme';

export default function TournamentLeaderboard() {
  const c = theme.colors;
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [rows, setRows] = useState<TournamentEntry[] | null>(null);
  const [name, setName] = useState('Tournament');

  useEffect(() => {
    if (!id) return;
    endpoints.tournamentLeaderboard(id).then((d) => {
      setRows(d.leaderboard);
      setName(d.tournament.name);
    });
  }, [id]);
  useEffect(() => { navigation.setOptions({ title: name }); }, [navigation, name]);

  if (!rows) return <Loading />;

  return (
    <Screen>
      <View style={{ padding: 20, paddingBottom: 8 }}><Label>Tournament leaderboard · ROI in window</Label></View>
      <Hairline inset={20} />
      {rows.map((e) => (
        <View key={e.userId}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13 }}>
            <Text style={{ width: 22, textAlign: 'center', color: e.rank <= 3 ? c.lime : c.faint, fontSize: 16, fontWeight: '700' }}>{e.rank}</Text>
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
    </Screen>
  );
}
