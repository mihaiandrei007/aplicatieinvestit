import { Router } from 'express';
import { prisma } from '../db.js';
import { isOwnerEmail } from '../config.js';
import { asyncHandler, forbidden } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';

/**
 * In-app admin API: JSON list of signups, restricted to the owner account
 * (the logged-in user whose email matches OWNER_EMAIL). Mounted under /api.
 * There is intentionally no public/web admin surface — only the owner's own
 * app session can reach this.
 */
export const adminApiRouter = Router();

adminApiRouter.get(
  '/admin/users',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, select: { email: true } });
    if (!isOwnerEmail(me.email)) throw forbidden('Admins only.');

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        displayName: true,
        email: true,
        createdAt: true,
        cash: true,
        currentStreak: true,
        _count: { select: { transactions: true, predictions: true } },
      },
    });

    res.json({
      users: users.map((u) => ({
        id: u.id,
        displayName: u.displayName,
        email: u.email,
        createdAt: u.createdAt,
        cash: u.cash,
        currentStreak: u.currentStreak,
        trades: u._count.transactions,
        predictions: u._count.predictions,
      })),
    });
  }),
);
