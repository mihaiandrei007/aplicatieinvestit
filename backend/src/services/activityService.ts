/**
 * Activity service: emits an ActivityEvent in all the groups a user
 * belongs to (the social feed, Stage 2).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db.js';
import { hub } from '../realtime/hub.js';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Creates one event in each of the user's groups.
 * Accepts a transaction client so it is atomic with the trade that triggers it.
 */
export async function emitToUserGroups(
  userId: string,
  type: string,
  payload: Prisma.InputJsonValue,
  db: Db = prisma,
): Promise<void> {
  const memberships = await db.membership.findMany({ where: { userId }, select: { groupId: true } });
  if (memberships.length === 0) return;
  await db.activityEvent.createMany({
    data: memberships.map((m) => ({ groupId: m.groupId, userId, type, payload })),
  });
  for (const m of memberships) {
    hub.broadcastToGroup(m.groupId, { type: 'NEW_ACTIVITY', payload: { groupId: m.groupId, kind: type } });
  }
}

/** Emits an event in a single group (e.g. on joining). */
export async function emitToGroup(
  groupId: string,
  userId: string,
  type: string,
  payload: Prisma.InputJsonValue,
  db: Db = prisma,
): Promise<void> {
  await db.activityEvent.create({ data: { groupId, userId, type, payload } });
  hub.broadcastToGroup(groupId, { type: 'NEW_ACTIVITY', payload: { groupId, kind: type } });
}
