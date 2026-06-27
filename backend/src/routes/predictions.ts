import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, badRequest } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { isDirection, MIN_STAKE, MAX_STAKE, DEFAULT_MULTIPLIER, type Direction } from '../lib/prediction.js';
import { placePrediction } from '../services/predictionService.js';

export const predictionsRouter = Router();

const placeSchema = z.object({
  symbol: z.string().min(1),
  direction: z.string(),
  stake: z.number().positive(),
});

/** Plasează o predicție rapidă (SUS/JOS) pe direcția unei acțiuni. */
predictionsRouter.post(
  '/predictions',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = placeSchema.safeParse(req.body);
    if (!parsed.success || !isDirection(parsed.data.direction)) {
      throw badRequest('Cerere invalidă (symbol, direction UP/DOWN, stake).');
    }
    try {
      const { prediction, cashAfter } = await placePrediction(
        req.userId!,
        parsed.data.symbol,
        parsed.data.direction as Direction,
        parsed.data.stake,
      );
      res.status(201).json({
        prediction: {
          id: prediction.id,
          symbol: prediction.symbol,
          direction: prediction.direction,
          stake: prediction.stake,
          multiplier: prediction.multiplier,
          priceAtBet: prediction.priceAtBet,
        },
        cash: cashAfter,
      });
    } catch (e) {
      throw badRequest((e as Error).message);
    }
  }),
);

/** Predicțiile mele (în așteptare + rezolvate recent) + reguli. */
predictionsRouter.get(
  '/predictions',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json({
      multiplier: DEFAULT_MULTIPLIER,
      minStake: MIN_STAKE,
      maxStake: MAX_STAKE,
      predictions,
    });
  }),
);
