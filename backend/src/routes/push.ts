import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, badRequest } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { registerToken } from '../services/pushService.js';

export const pushRouter = Router();

const tokenSchema = z.object({
  token: z.string().min(1),
  platform: z.string().optional(),
});

/** Înregistrează token-ul de push al dispozitivului curent. */
pushRouter.post(
  '/register',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = tokenSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Token invalid.');
    await registerToken(req.userId!, parsed.data.token, parsed.data.platform ?? 'expo');
    res.status(201).json({ ok: true });
  }),
);
