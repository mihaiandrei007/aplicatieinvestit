/**
 * Serviciu de activitate: emite ActivityEvent în toate grupurile din care
 * face parte un utilizator (feed-ul social, Etapa 2).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db.js';
import { hub } from '../realtime/hub.js';

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Creează câte un eveniment în fiecare grup al utilizatorului.
 * Acceptă un client de tranzacție ca să fie atomic cu trade-ul care îl declanșează.
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

/** Emite un eveniment într-un singur grup (ex. la alăturare). */
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
