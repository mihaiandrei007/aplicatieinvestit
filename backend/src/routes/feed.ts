import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { asyncHandler, badRequest, forbidden, notFound } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { toSkipTake } from '../lib/paginate.js';
import {
  buildActivityMessage,
  summarizeReactions,
  isAllowedEmoji,
  type ActivityType,
} from '../lib/social.js';

export const feedRouter = Router();

/** Verifică apartenența la grup; aruncă dacă nu e membru. */
async function assertMember(groupId: string, userId: string): Promise<void> {
  const membership = await prisma.membership.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
  if (!membership) throw forbidden('Nu ești membru al acestui grup.');
}

/** Găsește grupul unui eveniment și verifică apartenența. */
async function loadEventForMember(eventId: string, userId: string) {
  const event = await prisma.activityEvent.findUnique({ where: { id: eventId } });
  if (!event) throw notFound('Eveniment inexistent.');
  await assertMember(event.groupId, userId);
  return event;
}

/** Feed-ul unui grup, paginat, cu mesaj formatat + reacții + nr. comentarii. */
feedRouter.get(
  '/groups/:id/feed',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const groupId = req.params.id!;
    await assertMember(groupId, req.userId!);
    const { skip, take } = toSkipTake({
      page: Number(req.query.page ?? 1),
      pageSize: Number(req.query.pageSize ?? 20),
    });

    const [events, total] = await Promise.all([
      prisma.activityEvent.findMany({
        where: { groupId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          user: { select: { displayName: true } },
          reactions: { select: { emoji: true, userId: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.activityEvent.count({ where: { groupId } }),
    ]);

    res.json({
      total,
      events: events.map((e) => ({
        id: e.id,
        type: e.type,
        createdAt: e.createdAt,
        actor: e.user.displayName,
        message: buildActivityMessage(
          e.type as ActivityType,
          e.user.displayName,
          e.payload as Record<string, unknown>,
        ),
        reactions: summarizeReactions(e.reactions, req.userId!),
        commentCount: e._count.comments,
      })),
    });
  }),
);

const reactSchema = z.object({ emoji: z.string().min(1) });

/** Comută o reacție (adaugă dacă lipsește, scoate dacă există). */
feedRouter.post(
  '/events/:id/reactions',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = reactSchema.safeParse(req.body);
    if (!parsed.success || !isAllowedEmoji(parsed.data.emoji)) throw badRequest('Emoji invalid.');
    const event = await loadEventForMember(req.params.id!, req.userId!);

    const key = { eventId_userId_emoji: { eventId: event.id, userId: req.userId!, emoji: parsed.data.emoji } };
    const existing = await prisma.reaction.findUnique({ where: key });
    if (existing) {
      await prisma.reaction.delete({ where: key });
    } else {
      await prisma.reaction.create({ data: { eventId: event.id, userId: req.userId!, emoji: parsed.data.emoji } });
    }

    const reactions = await prisma.reaction.findMany({
      where: { eventId: event.id },
      select: { emoji: true, userId: true },
    });
    res.json({ reactions: summarizeReactions(reactions, req.userId!) });
  }),
);

const commentSchema = z.object({ body: z.string().trim().min(1).max(500) });

/** Adaugă un comentariu la un eveniment. */
feedRouter.post(
  '/events/:id/comments',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = commentSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Comentariu invalid (1–500 caractere).');
    const event = await loadEventForMember(req.params.id!, req.userId!);

    const comment = await prisma.comment.create({
      data: { eventId: event.id, userId: req.userId!, body: parsed.data.body },
      include: { user: { select: { displayName: true } } },
    });
    res.status(201).json({
      comment: {
        id: comment.id,
        body: comment.body,
        author: comment.user.displayName,
        createdAt: comment.createdAt,
      },
    });
  }),
);

/** Listează comentariile unui eveniment (cronologic). */
feedRouter.get(
  '/events/:id/comments',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const event = await loadEventForMember(req.params.id!, req.userId!);
    const comments = await prisma.comment.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { displayName: true } } },
    });
    res.json({
      comments: comments.map((c) => ({
        id: c.id,
        body: c.body,
        author: c.user.displayName,
        createdAt: c.createdAt,
      })),
    });
  }),
);
