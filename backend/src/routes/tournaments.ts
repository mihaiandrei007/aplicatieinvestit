import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, badRequest, conflict, forbidden, notFound } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { computeEquity } from '../services/portfolioService.js';
import { computeRoi } from '../lib/leaderboard.js';

export const tournamentsRouter = Router();

async function assertMember(groupId: string, userId: string): Promise<void> {
  const m = await prisma.membership.findUnique({ where: { groupId_userId: { groupId, userId } } });
  if (!m) throw forbidden('Nu ești membru al acestui grup.');
}

const createSchema = z.object({
  name: z.string().min(2).max(60),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
});

/** Creează un turneu într-un grup. Creatorul e înscris automat. */
tournamentsRouter.post(
  '/groups/:id/tournaments',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    await assertMember(groupId, req.userId!);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Date turneu invalide.');
    if (parsed.data.endsAt <= parsed.data.startsAt) throw badRequest('endsAt trebuie să fie după startsAt.');

    const { equity } = await computeEquity(req.userId!);
    const tournament = await prisma.tournament.create({
      data: {
        groupId,
        name: parsed.data.name,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        entries: { create: { userId: req.userId!, startEquity: equity } },
      },
    });
    res.status(201).json({ tournament: { id: tournament.id, name: tournament.name } });
  }),
);

/** Lista turneelor unui grup. */
tournamentsRouter.get(
  '/groups/:id/tournaments',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    await assertMember(groupId, req.userId!);
    const tournaments = await prisma.tournament.findMany({
      where: { groupId },
      orderBy: { startsAt: 'desc' },
      include: { _count: { select: { entries: true } } },
    });
    res.json({
      tournaments: tournaments.map((t) => ({
        id: t.id,
        name: t.name,
        startsAt: t.startsAt,
        endsAt: t.endsAt,
        participants: t._count.entries,
      })),
    });
  }),
);

/** Înscriere în turneu (capturează capitalul de start). */
tournamentsRouter.post(
  '/tournaments/:id/join',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id! } });
    if (!tournament) throw notFound('Turneu inexistent.');
    await assertMember(tournament.groupId, req.userId!);

    const existing = await prisma.tournamentEntry.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: req.userId! } },
    });
    if (existing) throw conflict('Ești deja înscris în acest turneu.');

    const { equity } = await computeEquity(req.userId!);
    await prisma.tournamentEntry.create({
      data: { tournamentId: tournament.id, userId: req.userId!, startEquity: equity },
    });
    res.status(201).json({ ok: true });
  }),
);

/** Clasamentul turneului: ROI de la capitalul de înscriere până acum. */
tournamentsRouter.get(
  '/tournaments/:id/leaderboard',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id! },
      include: { entries: { include: { user: { select: { id: true, displayName: true } } } } },
    });
    if (!tournament) throw notFound('Turneu inexistent.');
    await assertMember(tournament.groupId, req.userId!);

    const rows = await Promise.all(
      tournament.entries.map(async (e) => {
        const { equity } = await computeEquity(e.userId);
        return {
          userId: e.userId,
          displayName: e.user.displayName,
          startEquity: e.startEquity,
          equity,
          roi: computeRoi(e.startEquity, equity),
        };
      }),
    );
    rows.sort((a, b) => b.roi - a.roi || a.displayName.localeCompare(b.displayName));

    res.json({
      tournament: { id: tournament.id, name: tournament.name, startsAt: tournament.startsAt, endsAt: tournament.endsAt },
      leaderboard: rows.map((r, i) => ({ rank: i + 1, ...r, isMe: r.userId === req.userId })),
    });
  }),
);
