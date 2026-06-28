import React, { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Label, Hairline, SymbolTile, Loading } from '../src/components/ui';
import { endpoints, type NewsItem } from '../src/api/client';
import { theme } from '../src/theme';

export default function NewsScreen() {
  const c = theme.colors;
  const [news, setNews] = useState<NewsItem[] | null>(null);

  const load = useCallback(async () => {
    setNews((await endpoints.news()).news);
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!news) return <Loading />;

  return (
    <Screen>
      <View style={{ padding: 20, paddingBottom: 8 }}>
        <Label>All news · interpret the direction yourself</Label>
      </View>
      <Hairline inset={20} />
      {news.length === 0 ? (
        <Text style={{ color: c.muted, padding: 20 }}>No news yet. It appears as the market advances.</Text>
      ) : (
        news.map((n) => (
          <View key={n.id}>
            <Pressable onPress={() => Alert.alert(n.headline, `${n.source ? n.source + '\n\n' : ''}${n.body}`)}>
              <View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
                {n.symbol ? <SymbolTile symbol={n.symbol} size={34} /> : null}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', lineHeight: 19 }}>{n.headline}</Text>
                  {!!n.source && <Label style={{ marginTop: 4 }}>{n.source}</Label>}
                </View>
              </View>
            </Pressable>
            <Hairline inset={20} />
          </View>
        ))
      )}
    </Screen>
  );
}
