import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Label, H1, Hairline, Button, Monogram, Loading } from '../src/components/ui';
import { endpoints, type BadgeView, type StreakState } from '../src/api/client';
import { useAuth } from '../src/auth/AuthContext';
import { theme } from '../src/theme';

export default function ProfileScreen() {
  const c = theme.colors;
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [badges, setBadges] = useState<BadgeView[] | null>(null);
  const [streak, setStreak] = useState<StreakState | null>(null);

  const load = useCallback(async () => {
    const [b, s] = await Promise.all([endpoints.badges(), endpoints.streak()]);
    setBadges(b.badges);
    setStreak(s);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!badges) return <Loading />;
  const earned = badges.filter((b) => b.earned).length;

  return (
    <Screen>
      <View style={{ padding: 20, gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Monogram name={user?.displayName ?? ''} size={52} />
          <View>
            <H1>{user?.displayName}</H1>
            <Label>{earned}/{badges.length} badges · streak {streak?.currentStreak ?? 0} days</Label>
          </View>
        </View>

        <Pressable onPress={() => router.push('/wrapped')} style={{ borderWidth: 1, borderColor: c.lime, borderRadius: 6, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: c.lime, fontWeight: '700' }}>InvestPals Wrapped</Text>
            <Label>Your summary · shareable</Label>
          </View>
          <Text style={{ color: c.lime, fontSize: 18 }}>›</Text>
        </Pressable>
      </View>
      <Hairline inset={20} />

      <View style={{ padding: 20, paddingBottom: 8 }}><Label>Badges</Label></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 10 }}>
        {badges.map((b) => (
          <View
            key={b.code}
            style={{ width: '47%', borderWidth: 1, borderColor: b.earned ? c.lime : c.border, borderRadius: 6, padding: 12, opacity: b.earned ? 1 : 0.4 }}
          >
            <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>{b.earned ? '◆ ' : '◇ '}{b.label}</Text>
            <Text style={{ color: c.muted, fontSize: 11, marginTop: 3 }}>{b.description}</Text>
          </View>
        ))}
      </View>

      <View style={{ padding: 20, marginTop: 8 }}>
        <Button title="LOG OUT" variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}
