import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Screen, Title, Subtitle, Card, Button, Loading } from '../../../src/components/ui';
import { endpoints, ApiError, type QuizView, type QuizResult } from '../../../src/api/client';
import { theme } from '../../../src/theme';

export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizView | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    endpoints
      .quiz(id)
      .then((q) => {
        setQuiz(q);
        navigation.setOptions({ title: q.title });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Quiz indisponibil.'));
  }, [id, navigation]);

  async function submit() {
    if (!quiz) return;
    setBusy(true);
    try {
      setResult(await endpoints.submitQuiz(quiz.id, answers));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Trimitere eșuată.');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Screen>
        <Card>
          <Text style={{ color: theme.colors.red }}>{error}</Text>
          <Button title="Înapoi" variant="ghost" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }
  if (!quiz) return <Loading />;

  return (
    <Screen>
      <Title>{quiz.title}</Title>
      {result && (
        <Card>
          <Subtitle>
            Scor: {result.score}/{result.total}
          </Subtitle>
        </Card>
      )}

      {quiz.questions.map((q) => {
        const res = result?.results.find((r) => r.questionId === q.id);
        return (
          <Card key={q.id}>
            <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{q.question}</Text>
            {q.options.map((opt, idx) => {
              const selected = answers[q.id] === idx;
              const showCorrect = result && res && idx === answers[q.id];
              const bg = selected ? theme.colors.cardAlt : 'transparent';
              const borderColor = showCorrect
                ? res!.correct
                  ? theme.colors.green
                  : theme.colors.red
                : theme.colors.border;
              return (
                <Pressable
                  key={idx}
                  disabled={!!result}
                  onPress={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                  style={{ backgroundColor: bg, borderWidth: 1, borderColor, borderRadius: theme.radius, padding: 12 }}
                >
                  <Text style={{ color: theme.colors.text }}>{opt}</Text>
                </Pressable>
              );
            })}
            {res && <Text style={{ color: theme.colors.muted, fontSize: 13 }}>{res.explanation}</Text>}
          </Card>
        );
      })}

      {!result && <Button title="Trimite răspunsurile" onPress={submit} loading={busy} />}
      {result && <Button title="Înapoi la academie" variant="ghost" onPress={() => router.back()} />}
    </Screen>
  );
}
