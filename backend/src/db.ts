import { PrismaClient } from '@prisma/client';

/** Client Prisma partajat (singleton). */
export const prisma = new PrismaClient();
