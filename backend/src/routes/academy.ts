import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, badRequest, notFound } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { MISSIONS, QUIZZES, gradeQuiz, nextMission, academyProgress } from '../lib/academy.js';
import { compoundInterest, futureValueWithContributions, ruleOf72 } from '../lib/finance.js';
import { portfolioRiskScore, type RiskPosition } from '../lib/risk.js';
import { buildSnapshot } from '../services/portfolioService.js';

export const academyRouter = Router();

/** Misiunile + progresul meu + următoarea misiune recomandată. */
academyRouter.get(
  '/academy/missions',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const done = await prisma.academyProgress.findMany({
      where: { userId: req.userId },
      select: { missionId: true, completedAt: true },
    });
    const doneIds = done.map((d) => d.missionId);
    res.json({
      progress: academyProgress(doneIds),
      next: nextMission(doneIds),
      missions: [...MISSIONS]
        .sort((a, b) => a.order - b.order)
        .map((m) => ({
          ...m,
          completed: doneIds.includes(m.id),
          completedAt: done.find((d) => d.missionId === m.id)?.completedAt ?? null,
        })),
    });
  }),
);

/** Marchează o misiune drept finalizată. */
academyRouter.post(
  '/academy/missions/:id/complete',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const missionId = req.params.id!;
    if (!MISSIONS.some((m) => m.id === missionId)) throw notFound('Misiune inexistentă.');
    await prisma.academyProgress.upsert({
      where: { userId_missionId: { userId: req.userId!, missionId } },
      update: {},
      create: { userId: req.userId!, missionId },
    });
    res.status(201).json({ ok: true });
  }),
);

/** Quiz-ul (fără răspunsurile corecte). */
academyRouter.get(
  '/academy/quizzes/:id',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const quiz = QUIZZES.find((q) => q.id === req.params.id);
    if (!quiz) throw notFound('Quiz inexistent.');
    res.json({
      id: quiz.id,
      title: quiz.title,
      missionId: quiz.missionId,
      questions: quiz.questions.map((q) => ({ id: q.id, question: q.question, options: q.options })),
    });
  }),
);

const submitSchema = z.object({ answers: z.record(z.number().int()) });

/** Trimite răspunsurile unui quiz și primește nota + explicații. */
academyRouter.post(
  '/academy/quizzes/:id/submit',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const quiz = QUIZZES.find((q) => q.id === req.params.id);
    if (!quiz) throw notFound('Quiz inexistent.');
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Răspunsuri invalide.');

    const graded = gradeQuiz(quiz, parsed.data.answers);
    await prisma.quizAttempt.create({
      data: { userId: req.userId!, quizId: quiz.id, score: graded.score, total: graded.total },
    });
    res.json(graded);
  }),
);

const calcSchema = z.object({
  principal: z.number().min(0),
  annualRate: z.number(),
  years: z.number().min(0),
  monthlyContribution: z.number().min(0).optional(),
  compoundsPerYear: z.number().int().positive().optional(),
});

/** Calculator de dobândă compusă / valoare viitoare (educativ). */
academyRouter.post(
  '/academy/calculator/compound',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = calcSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Parametri invalizi.');
    const { principal, annualRate, years, monthlyContribution, compoundsPerYear } = parsed.data;
    res.json({
      compound: compoundInterest(principal, annualRate, years, compoundsPerYear ?? 1),
      withContributions:
        monthlyContribution !== undefined
          ? futureValueWithContributions(principal, annualRate, years, monthlyContribution)
          : null,
      yearsToDouble: annualRate > 0 ? ruleOf72(annualRate * 100) : null,
    });
  }),
);

/** Scor de risc al portofoliului meu (din ponderi și volatilități). */
academyRouter.get(
  '/academy/risk-score',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const snapshot = await buildSnapshot(req.userId!);
    const totalMarket = snapshot.holdings.reduce((s, h) => s + h.marketValue, 0);

    if (totalMarket === 0) {
      res.json({ score: 0, message: 'Nu deții instrumente — risc de piață zero.' });
      return;
    }

    // Volatilitatea fiecărui simbol din instrumente.
    const instruments = await prisma.instrument.findMany({ select: { symbol: true, volatility: true } });
    const volBySymbol = new Map(instruments.map((i) => [i.symbol, i.volatility]));
    const positions: RiskPosition[] = snapshot.holdings.map((h) => ({
      weight: h.marketValue / totalMarket,
      volatility: volBySymbol.get(h.symbol) ?? 0.2,
    }));

    res.json({ score: portfolioRiskScore(positions), positions: positions.length });
  }),
);
