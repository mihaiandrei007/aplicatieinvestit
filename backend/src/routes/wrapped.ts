import { Router } from 'express';
import { asyncHandler } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { getWrapped } from '../services/wrappedService.js';

export const wrappedRouter = Router();

/** The user's "Wrapped" summary. */
wrappedRouter.get(
  '/wrapped',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await getWrapped(req.userId!));
  }),
);
