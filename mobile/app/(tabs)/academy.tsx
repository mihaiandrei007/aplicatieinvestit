import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, Title, Subtitle, Card, Button, Loading } from '../../src/components/ui';
import { endpoints, type BadgeView } from '../../src/api/client';
import { theme } from '../../src/theme';

/** Misiunile care au un quiz asociat (convenție: quiz-<missionId>). */
const MISSIONS_WITH_QUIZ = new Set(['basics', 'diversify']);

interface MissionView {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function AcademyScreen() {
  const router = useRouter();
  const [missions, setMissions] = useState<MissionView[] | null>(null);
  const [progress, setProgress] = useState(0);
  const [badges, setBadges] = useState<BadgeView[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [m, b] = await Promise.all([endpoints.missions(), endpoints.badges()]);
    setMissions(m.missions);
    setProgress(m.progress);
    setBadges(b.badges);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function complete(id: string) {
    setBusy(true);
    try {
      await endpoints.completeMission(id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!missions) return <Loading />;

  return (
    <Screen>
      <Title>Academie</Title>
      <Subtitle>Progres: {progress}%</Subtitle>

      {missions.map((m) => (
        <Card key={m.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '700' }}>
              {m.completed ? '✅ ' : ''}
              {m.title}
            </Text>
          </View>
          <Text style={{ color: theme.colors.muted }}>{m.description}</Text>
          {MISSIONS_WITH_QUIZ.has(m.id) && (
            <Button title="Dă quiz-ul" variant="ghost" onPress={() => router.push(`/academy/quiz/quiz-${m.id}`)} />
          )}
          {!m.completed && <Button title="Marchează finalizată" onPress={() => complete(m.id)} loading={busy} />}
        </Card>
      ))}

      <Subtitle>Insigne</Subtitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1) }}>
        {badges.map((b) => (
          <View
            key={b.code}
            style={{
              backgroundColor: b.earned ? theme.colors.cardAlt : theme.colors.card,
              borderColor: b.earned ? theme.colors.primary : theme.colors.border,
              borderWidth: 1,
              borderRadius: theme.radius,
              padding: theme.spacing(1.5),
              opacity: b.earned ? 1 : 0.5,
              width: '47%',
            }}
          >
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
              {b.earned ? '🏅 ' : '🔒 '}
              {b.label}
            </Text>
            <Text style={{ color: theme.colors.muted, fontSize: 12 }}>{b.description}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
