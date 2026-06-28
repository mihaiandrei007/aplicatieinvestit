import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, badRequest } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { isDirection, type Direction } from '../lib/prediction.js';
import { getTodayChallenge, submitDaily } from '../services/dailyService.js';

export const dailyRouter = Router();

/** The daily challenge. */
dailyRouter.get(
  '/daily',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await getTodayChallenge(req.userId!));
  }),
);

const schema = z.object({ direction: z.string() });

/** Vote on today's challenge direction (only once). */
dailyRouter.post(
  '/daily',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !isDirection(parsed.data.direction)) throw badRequest('Invalid direction (UP/DOWN).');
    try {
      await submitDaily(req.userId!, parsed.data.direction as Direction);
      res.status(201).json(await getTodayChallenge(req.userId!));
    } catch (e) {
      throw badRequest((e as Error).message);
    }
  }),
);
