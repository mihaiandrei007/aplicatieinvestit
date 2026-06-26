import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config } from '../config.js';
import { hashPassword, signToken, verifyPassword } from '../auth/auth.js';
import { asyncHandler, badRequest, conflict, unauthorized } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { verifyOAuthToken } from '../services/oauthService.js';
import { OAuthError } from '../lib/oauth.js';

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
    if (!user || !user.passwordHash) {
      // Cont inexistent sau creat prin OAuth (fără parolă).
      throw unauthorized('Email sau parolă greșite.');
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw unauthorized('Email sau parolă greșite.');
    }

    res.json({ token: signToken(user.id), user: publicUser(user) });
  }),
);

const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(1),
});

/**
 * Login/înregistrare prin OAuth. Clientul trimite ID token-ul de la Google/Apple;
 * serverul îl verifică (semnătură + claim-uri) și întoarce JWT-ul propriu.
 */
authRouter.post(
  '/oauth',
  asyncHandler(async (req, res) => {
    const parsed = oauthSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('provider și idToken sunt obligatorii.');

    let profile;
    try {
      profile = await verifyOAuthToken(parsed.data.provider, parsed.data.idToken);
    } catch (err) {
      if (err instanceof OAuthError) throw unauthorized(err.message);
      throw err;
    }

    // Caută după identitatea OAuth; apoi după email (leagă conturile existente).
    let user =
      (await prisma.user.findFirst({
        where: { oauthProvider: profile.provider, oauthSub: profile.providerSub },
      })) ?? (await prisma.user.findUnique({ where: { email: profile.email } }));

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          displayName: profile.displayName,
          oauthProvider: profile.provider,
          oauthSub: profile.providerSub,
          cash: config.startingCash,
          startingCash: config.startingCash,
        },
      });
    } else if (!user.oauthProvider) {
      // Leagă identitatea OAuth de contul existent (cu email).
      user = await prisma.user.update({
        where: { id: user.id },
        data: { oauthProvider: profile.provider, oauthSub: profile.providerSub },
      });
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
