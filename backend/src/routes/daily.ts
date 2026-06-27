import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, badRequest } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { isDirection, type Direction } from '../lib/prediction.js';
import { getTodayChallenge, submitDaily } from '../services/dailyService.js';

export const dailyRouter = Router();

/** Provocarea zilei. */
dailyRouter.get(
  '/daily',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await getTodayChallenge(req.userId!));
  }),
);

const schema = z.object({ direction: z.string() });

/** Votează direcția provocării de azi (o singură dată). */
dailyRouter.post(
  '/daily',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success || !isDirection(parsed.data.direction)) throw badRequest('Direcție invalidă (UP/DOWN).');
    try {
      await submitDaily(req.userId!, parsed.data.direction as Direction);
      res.status(201).json(await getTodayChallenge(req.userId!));
    } catch (e) {
      throw badRequest((e as Error).message);
    }
  }),
);
