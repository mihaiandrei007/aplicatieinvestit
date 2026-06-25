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
import { maskEmail } from '../lib/social.js';
import { computeEquity } from '../services/portfolioService.js';
import { emitToGroup } from '../services/activityService.js';

export const groupsRouter = Router();

/** Generează un cod de invitație unic, reîncercând la coliziune. */
async function uniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode(makeRng(randomInt(0, 2 ** 31)));
    const exists = await prisma.group.findUnique({ where: { inviteCode: code } });
    if (!exists) return code;
  }
  throw new Error('Nu s-a putut genera un cod de invitație unic.');
}

const createSchema = z.object({ name: z.string().min(2).max(60) });

/** Creează un grup; creatorul devine OWNER și membru. */
groupsRouter.post(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Nume invalid.');

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

/** Intră într-un grup cu un cod de invitație. */
groupsRouter.post(
  '/join',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = joinSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Cod de invitație lipsă.');
    if (!isValidInviteCode(parsed.data.inviteCode)) throw badRequest('Cod de invitație invalid.');

    const code = normalizeInviteCode(parsed.data.inviteCode);
    const group = await prisma.group.findUnique({ where: { inviteCode: code } });
    if (!group) throw notFound('Nu există niciun grup cu acest cod.');

    const existing = await prisma.membership.findUnique({
      where: { groupId_userId: { groupId: group.id, userId: req.userId! } },
    });
    if (existing) throw conflict('Ești deja membru al acestui grup.');

    await prisma.membership.create({ data: { groupId: group.id, userId: req.userId!, role: 'MEMBER' } });
    await emitToGroup(group.id, req.userId!, 'JOINED_GROUP', {});
    res.status(201).json({ group: { id: group.id, name: group.name } });
  }),
);

/** Grupurile din care fac parte. */
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

/** Membrii grupului cu profil public minimal (email mascat pentru intimitate). */
groupsRouter.get(
  '/:id/members',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    const me = await prisma.membership.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId! } },
    });
    if (!me) throw notFound('Grup inexistent sau nu ești membru.');

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

/** Clasamentul grupului după ROI. Doar membrii îl pot vedea. */
groupsRouter.get(
  '/:id/leaderboard',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    const membership = await prisma.membership.findUnique({
      where: { groupId_userId: { groupId, userId: req.userId! } },
      include: { group: { include: { memberships: { include: { user: true } } } } },
    });
    if (!membership) throw notFound('Grup inexistent sau nu ești membru.');

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
