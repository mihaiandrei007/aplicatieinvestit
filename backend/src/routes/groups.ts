import { Router } from 'express';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { asyncHandler, badRequest, conflict, notFound } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { generateInviteCode, normalizeInviteCode, isValidInviteCode } from '../lib/invite.js';
import { makeRng } from '../lib/priceSim.js';
import { rankByRoi, type Participant } from '../lib/leaderboard.js';
import { rankBySharpe, type SharpeParticipant } from '../lib/risk.js';
import { maskEmail } from '../lib/social.js';
import { computeEquity } from '../services/portfolioService.js';
import { emitToGroup } from '../services/activityService.js';

export const groupsRouter = Router();

/** Generates a unique invite code, retrying on collision. */
async function uniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode(makeRng(randomInt(0, 2 ** 31)));
    const exists = await prisma.group.findUnique({ where: { inviteCode: code } });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique invite code.');
}

const createSchema = z.object({ name: z.string().min(2).max(60) });

/** Creates a group; the creator becomes OWNER and a member. */
groupsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Invalid name.');

    const inviteCode = await uniqueInviteCode();
    const group = await prisma.group.create({
      data: {
        name: parsed.data.name,
        inviteCode,
        ownerId: req.userId!,
        startingCash: config.startingCash,
        memberships: { create: { userId: req.userId!, role: 'OWNER' } },
      },
    });

    res.status(201).json({ group: { id: group.id, name: group.name, inviteCode: group.inviteCode } });
  }),
);

const joinSchema = z.object({ inviteCode: z.string().min(1) });

/** Join a group with an invite code. */
groupsRouter.post(
  '/join',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Missing invite code.');
    if (!isValidInviteCode(parsed.data.inviteCode)) throw badRequest('Invalid invite code.');

    const code = normalizeInviteCode(parsed.data.inviteCode);
    const group = await prisma.group.findUnique({ where: { inviteCode: code } });
    if (!group) throw notFound('No group exists with this code.');

    const existing = await prisma.membership.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: req.userId! } },
    });
    if (existing) throw conflict('You are already a member of this group.');

    await prisma.membership.create({ data: { groupId: group.id, userId: req.userId!, role: 'MEMBER' } });
    await emitToGroup(group.id, req.userId!, 'JOINED_GROUP', {});
    res.status(201).json({ group: { id: group.id, name: group.name } });
  }),
);

/** The groups I belong to. */
groupsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.userId },
      include: { group: { include: { _count: { select: { memberships: true } } } } },
      orderBy: { joinedAt: 'desc' },
    });
    res.json({
      groups: memberships.map((m) => ({
        id: m.group.id,
        name: m.group.name,
        inviteCode: m.group.inviteCode,
        role: m.role,
        memberCount: m.group._count.memberships,
      })),
    });
  }),
);

/** Group members with a minimal public profile (email masked for privacy). */
groupsRouter.get(
  '/:id/members',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    const me = await prisma.membership.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId! } },
    });
    if (!me) throw notFound('Group not found or you are not a member.');

    const members = await prisma.membership.findMany({
      where: { groupId },
      include: { user: { select: { id: true, displayName: true, email: true, createdAt: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    res.json({
      members: members.map((m) => ({
        userId: m.user.id,
        displayName: m.user.displayName,
        email: maskEmail(m.user.email),
        role: m.role,
        joinedAt: m.joinedAt,
        memberSince: m.user.createdAt,
        isMe: m.user.id === req.userId,
      })),
    });
  }),
);

/** The group's leaderboard by ROI. Only members can see it. */
groupsRouter.get(
  '/:id/leaderboard',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    const membership = await prisma.membership.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId! } },
      include: { group: { include: { memberships: { include: { user: true } } } } },
    });
    if (!membership) throw notFound('Group not found or you are not a member.');

    const members = membership.group.memberships;
    const participants: Participant[] = await Promise.all(
      members.map(async (m) => {
        const { equity, startingCash } = await computeEquity(m.userId);
        return { userId: m.userId, displayName: m.user.displayName, startingCash, equity };
      }),
    );

    res.json({
      group: { id: membership.group.id, name: membership.group.name },
      leaderboard: rankByRoi(participants).map((e) => ({
        rank: e.rank,
        userId: e.userId,
        displayName: e.displayName,
        roi: e.roi,
        equity: e.equity,
        isMe: e.userId === req.userId,
      })),
    });
  }),
);

/** Risk-adjusted leaderboard (Sharpe), from the equity snapshots. */
groupsRouter.get(
  '/:id/leaderboard/sharpe',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    const membership = await prisma.membership.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId! } },
      include: { group: { include: { memberships: { include: { user: true } } } } },
    });
    if (!membership) throw notFound('Group not found or you are not a member.');

    const participants: SharpeParticipant[] = await Promise.all(
      membership.group.memberships.map(async (m) => {
        const snapshots = await prisma.equitySnapshot.findMany({
          where: { userId: m.userId },
          orderBy: { createdAt: 'asc' },
          select: { equity: true },
        });
        return {
          userId: m.userId,
          displayName: m.user.displayName,
          equitySeries: snapshots.map((s) => s.equity),
        };
      }),
    );

    res.json({
      group: { id: membership.group.id, name: membership.group.name },
      leaderboard: rankBySharpe(participants).map((e) => ({
        rank: e.rank,
        userId: e.userId,
        displayName: e.displayName,
        sharpe: e.sharpe,
        isMe: e.userId === req.userId,
      })),
    });
  }),
);
