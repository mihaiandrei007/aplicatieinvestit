/**
 * lib/academy — conținut educativ: misiuni + quiz-uri (din proiectul-părinte).
 *
 * Conținutul e static și pur; progresul utilizatorului se ține în DB.
 * Logica de notare a quiz-urilor și de progresie a misiunilor e testată.
 */

export interface Mission {
  id: string;
  title: string;
  description: string;
  /** Pasul (ordinea) în „academie". */
  order: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  /** Indexul răspunsului corect în `options`. */
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  missionId: string;
  title: string;
  questions: QuizQuestion[];
}

/** Misiunile academiei, în ordine. */
export const MISSIONS: readonly Mission[] = [
  { id: 'basics', order: 1, title: 'Ce este o acțiune', description: 'Înțelegi ce cumperi când cumperi o acțiune.' },
  { id: 'diversify', order: 2, title: 'Diversificarea', description: 'De ce „nu pune toate ouăle într-un coș".' },
  { id: 'risk-return', order: 3, title: 'Risc vs randament', description: 'Relația dintre risc și câștigul potențial.' },
  { id: 'compounding', order: 4, title: 'Dobânda compusă', description: 'Cum cresc banii exponențial în timp.' },
  { id: 'overtrading', order: 5, title: 'Anti-overtrading', description: 'De ce tranzacționarea excesivă strică randamentul.' },
];

/** Quiz-uri contextuale, legate de misiuni. */
export const QUIZZES: readonly Quiz[] = [
  {
    id: 'quiz-basics',
    missionId: 'basics',
    title: 'Bazele acțiunilor',
    questions: [
      {
        id: 'b1',
        question: 'O acțiune reprezintă...',
        options: ['Un împrumut către companie', 'O parte din proprietatea companiei', 'O garanție de profit'],
        correctIndex: 1,
        explanation: 'O acțiune este o cotă-parte din capitalul (proprietatea) companiei.',
      },
      {
        id: 'b2',
        question: 'Prețul unei acțiuni...',
        options: ['Este fix', 'Variază cu cererea și oferta', 'Crește mereu'],
        correctIndex: 1,
        explanation: 'Prețul fluctuează în funcție de cerere, ofertă și informații noi.',
      },
    ],
  },
  {
    id: 'quiz-diversify',
    missionId: 'diversify',
    title: 'Diversificare',
    questions: [
      {
        id: 'd1',
        question: 'Diversificarea ajută la...',
        options: ['Eliminarea oricărui risc', 'Reducerea riscului specific', 'Garantarea câștigului'],
        correctIndex: 1,
        explanation: 'Diversificarea reduce riscul specific unei singure companii, nu tot riscul.',
      },
    ],
  },
];

/** Notează un quiz pe baza răspunsurilor (index per întrebare). */
export function gradeQuiz(quiz: Quiz, answers: Readonly<Record<string, number>>): {
  score: number;
  total: number;
  results: Array<{ questionId: string; correct: boolean; explanation: string }>;
} {
  const results = quiz.questions.map((q) => ({
    questionId: q.id,
    correct: answers[q.id] === q.correctIndex,
    explanation: q.explanation,
  }));
  return { score: results.filter((r) => r.correct).length, total: quiz.questions.length, results };
}

/** Următoarea misiune nefinalizată, după codurile deja completate. */
export function nextMission(completedIds: readonly string[]): Mission | null {
  const done = new Set(completedIds);
  const ordered = [...MISSIONS].sort((a, b) => a.order - b.order);
  return ordered.find((m) => !done.has(m.id)) ?? null;
}

/** Procentul de finalizare a academiei. */
export function academyProgress(completedIds: readonly string[]): number {
  const valid = new Set(MISSIONS.map((m) => m.id));
  const done = new Set([...completedIds].filter((id) => valid.has(id)));
  return Math.round((done.size / MISSIONS.length) * 100);
}
