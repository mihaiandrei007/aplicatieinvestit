import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { hashPassword, signToken, verifyPassword } from '../auth/auth.js';
import { asyncHandler, badRequest, conflict, unauthorized } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Parola trebuie să aibă cel puțin 8 caractere.'),
  displayName: z.string().min(2).max(40),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Reprezentare publică a utilizatorului (fără hash-ul parolei). */
function publicUser(u: { id: string; email: string; displayName: string; cash: number; startingCash: number }) {
  return { id: u.id, email: u.email, displayName: u.displayName, cash: u.cash, startingCash: u.startingCash };
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Date invalide.');
    const { email, password, displayName } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw conflict('Există deja un cont cu acest email.');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        displayName,
        cash: config.startingCash,
        startingCash: config.startingCash,
      },
    });

    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Email sau parolă invalide.');
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw unauthorized('Email sau parolă greșite.');
    }

    res.json({ token: signToken(user.id), user: publicUser(user) });
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw unauthorized();
    res.json({ user: publicUser(user) });
  }),
);
