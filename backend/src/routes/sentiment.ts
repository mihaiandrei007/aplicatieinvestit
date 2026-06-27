import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, badRequest, notFound } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { isSentimentValue, summarizeBySymbol, type SentimentRow, type SentimentValue } from '../lib/sentiment.js';

export const sentimentRouter = Router();

const setSchema = z.object({ symbol: z.string().min(1), value: z.string() });

/**
 * Setează (sau comută) sentimentul utilizatorului pentru un simbol.
 * Atingerea aceleiași valori o anulează (toggle off).
 */
sentimentRouter.post(
  '/sentiment',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = setSchema.safeParse(req.body);
    if (!parsed.success || !isSentimentValue(parsed.data.value)) {
      throw badRequest('Sentiment invalid (BULLISH/BEARISH).');
    }
    const { symbol } = parsed.data;
    const value = parsed.data.value as SentimentValue;

    const instrument = await prisma.instrument.findUnique({ where: { symbol } });
    if (!instrument) throw notFound(`Instrumentul ${symbol} nu există.`);

    const key = { userId_symbol: { userId: req.userId!, symbol } };
    const existing = await prisma.sentiment.findUnique({ where: key });

    let myValue: SentimentValue | null;
    if (existing && existing.value === value) {
      await prisma.sentiment.delete({ where: key });
      myValue = null;
    } else {
      await prisma.sentiment.upsert({
        where: key,
        update: { value },
        create: { userId: req.userId!, symbol, value },
      });
      myValue = value;
    }

    res.json({ symbol, myValue });
  }),
);

/** Sentimentul agregat al grupului, pe simboluri. */
sentimentRouter.get(
  '/groups/:id/sentiment',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    const membership = await prisma.membership.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId! } },
    });
    if (!membership) throw notFound('Grup inexistent sau nu ești membru.');

    const memberIds = (
      await prisma.membership.findMany({ where: { groupId }, select: { userId: true } })
    ).map((m) => m.userId);

    const rows = await prisma.sentiment.findMany({
      where: { userId: { in: memberIds } },
      select: { symbol: true, value: true, userId: true },
    });

    const summaries = summarizeBySymbol(rows as SentimentRow[]);
    const mine = new Map(rows.filter((r) => r.userId === req.userId).map((r) => [r.symbol, r.value]));

    res.json({
      sentiment: summaries.map((s) => ({ ...s, myValue: mine.get(s.symbol) ?? null })),
    });
  }),
);
