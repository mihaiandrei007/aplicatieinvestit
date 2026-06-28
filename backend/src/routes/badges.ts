import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { BADGES } from '../lib/gamification.js';
import { awardBadges } from '../services/gamificationService.js';

export const badgesRouter = Router();

const byCode = new Map(BADGES.map((b) => [b.code, b]));

/** My badges (earned) + the full catalog (to display "locked" ones). */
badgesRouter.get(
  '/me/badges',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    // Re-evaluate on request, to catch badges earned through price moves.
    await awardBadges(req.userId!);
    const owned = await prisma.badge.findMany({
      where: { userId: req.userId },
      orderBy: { awardedAt: 'asc' },
    });
    const ownedCodes = new Set(owned.map((b) => b.code));
    res.json({
      badges: BADGES.map((b) => ({
        code: b.code,
        label: b.label,
        description: b.description,
        earned: ownedCodes.has(b.code),
        awardedAt: owned.find((o) => o.code === b.code)?.awardedAt ?? null,
      })),
    });
  }),
);
