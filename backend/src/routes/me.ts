import { Router } from 'express';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { asyncHandler } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { applyCheckIn, checkInCredits, type StreakState } from '../lib/streak.js';
import { grantCredits } from '../lib/tradeCredits.js';

export const meRouter = Router();

/** The current date in YYYY-MM-DD format (server's local time zone). */
function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function readStreak(u: {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  streakFreezes: number;
}): StreakState {
  return {
    currentStreak: u.currentStreak,
    longestStreak: u.longestStreak,
    lastCheckIn: u.lastCheckIn,
    freezes: u.streakFreezes,
  };
}

/** Current streak state + credits. */
meRouter.get(
  '/me/streak',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    res.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      freezes: user.streakFreezes,
      lastCheckIn: user.lastCheckIn,
      tradeCredits: user.tradeCredits,
      checkedInToday: user.lastCheckIn === todayString(),
    });
  }),
);

/** Daily check-in: advances the streak and grants trade credits. */
meRouter.post(
  '/me/checkin',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const today = todayString();
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
    const result = applyCheckIn(readStreak(user), today);

    if (result.alreadyCheckedIn) {
      res.json({
        alreadyCheckedIn: true,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        freezes: user.streakFreezes,
        creditsGranted: 0,
        tradeCredits: user.tradeCredits,
      });
      return;
    }

    const creditsGranted = checkInCredits(result.state.currentStreak);
    const tradeCredits = grantCredits(user.tradeCredits, creditsGranted, config.tradeCreditsMax);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentStreak: result.state.currentStreak,
        longestStreak: result.state.longestStreak,
        lastCheckIn: result.state.lastCheckIn,
        streakFreezes: result.state.freezes,
        tradeCredits,
      },
    });

    res.json({
      alreadyCheckedIn: false,
      currentStreak: result.state.currentStreak,
      longestStreak: result.state.longestStreak,
      freezes: result.state.freezes,
      usedFreeze: result.usedFreeze,
      streakReset: result.streakReset,
      earnedFreeze: result.earnedFreeze,
      creditsGranted,
      tradeCredits,
    });
  }),
);
