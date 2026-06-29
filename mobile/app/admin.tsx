import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Label, Hairline, Mono, Loading, ErrorText } from '../src/components/ui';
import { endpoints, ApiError, type AdminUser } from '../src/api/client';
import { theme, formatMoney } from '../src/theme';

const ROLE: Record<string, string> = { STUDENT_M: 'Student (M)', STUDENT_F: 'Student (F)', OTHER: 'Other' };
const EXP: Record<string, string> = { NEW: 'New', SOME: 'Some', PRO: 'Pro' };
const lbl = (map: Record<string, string>, v?: string | null) => (v && map[v]) || '—';

export default function AdminScreen() {
  const c = theme.colors;
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setUsers((await endpoints.adminUsers()).users);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not load users.');
      setUsers([]);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!users) return <Loading />;

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
        <Label>{users.length} account{users.length === 1 ? '' : 's'} · newest first</Label>
      </View>
      {!!error && <View style={{ paddingHorizontal: 20 }}><ErrorText>{error}</ErrorText></View>}
      <Hairline inset={20} />

      {/* column heads */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 8, gap: 10 }}>
        <Text style={{ flex: 1, color: c.faint, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>User</Text>
        <Text style={{ width: 54, textAlign: 'right', color: c.faint, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>Trades</Text>
        <Text style={{ width: 64, textAlign: 'right', color: c.faint, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' }}>Cash</Text>
      </View>
      <Hairline inset={20} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {users.map((u) => {
          const joined = new Date(u.createdAt).toISOString().slice(0, 10);
          return (
            <View key={u.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{u.displayName}</Text>
                  <Text style={{ color: c.muted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{u.email}</Text>
                  <Text style={{ color: c.faint, fontSize: 10, marginTop: 2 }}>{lbl(ROLE, u.role)} · {lbl(EXP, u.experience)} · joined {joined} · {u.predictions} bets · streak {u.currentStreak}</Text>
                </View>
                <Mono style={{ width: 54, textAlign: 'right', fontSize: 14, fontWeight: '600' }}>{u.trades}</Mono>
                <Mono style={{ width: 64, textAlign: 'right', fontSize: 13 }}>{formatMoney(u.cash)}</Mono>
              </View>
              <Hairline inset={20} />
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}
