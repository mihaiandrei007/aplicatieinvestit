import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { config, isOwnerEmail } from '../config.js';
import { hashPassword, signToken, verifyPassword } from '../auth/auth.js';
import { asyncHandler, badRequest, conflict, unauthorized } from '../http/errors.js';
import { requireAuth, type AuthedRequest } from '../http/requireAuth.js';
import { verifyOAuthToken } from '../services/oauthService.js';
import { OAuthError } from '../lib/oauth.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
  displayName: z.string().min(2).max(40),
  role: z.enum(['STUDENT_M', 'STUDENT_F', 'OTHER']).optional(),
  experience: z.enum(['NEW', 'SOME', 'PRO']).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/** Public representation of the user (without the password hash). */
function publicUser(u: {
  id: string;
  email: string;
  displayName: string;
  cash: number;
  startingCash: number;
  tradeCredits: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  role?: string | null;
  experience?: string | null;
}) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    cash: u.cash,
    startingCash: u.startingCash,
    tradeCredits: u.tradeCredits,
    currentStreak: u.currentStreak,
    longestStreak: u.longestStreak,
    streakFreezes: u.streakFreezes,
    role: u.role ?? null,
    experience: u.experience ?? null,
    isAdmin: isOwnerEmail(u.email),
  };
}

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? 'Invalid data.');
    const { email, password, displayName, role, experience } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw conflict('An account with this email already exists.');

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        displayName,
        role: role ?? null,
        experience: experience ?? null,
        cash: config.startingCash,
        startingCash: config.startingCash,
        tradeCredits: config.tradeCreditsStart,
      },
    });

    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  }),
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('Invalid email or password.');
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Account does not exist or was created via OAuth (no password).
      throw unauthorized('Incorrect email or password.');
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      throw unauthorized('Incorrect email or password.');
    }

    res.json({ token: signToken(user.id), user: publicUser(user) });
  }),
);

const oauthSchema = z.object({
  provider: z.enum(['google', 'apple']),
  idToken: z.string().min(1),
});

/**
 * Log in / sign up via OAuth. The client sends the ID token from Google/Apple;
 * the server verifies it (signature + claims) and returns its own JWT.
 */
authRouter.post(
  '/oauth',
  asyncHandler(async (req, res) => {
    const parsed = oauthSchema.safeParse(req.body);
    if (!parsed.success) throw badRequest('provider and idToken are required.');

    let profile;
    try {
      profile = await verifyOAuthToken(parsed.data.provider, parsed.data.idToken);
    } catch (err) {
      if (err instanceof OAuthError) throw unauthorized(err.message);
      throw err;
    }

    // Look up by OAuth identity, then by email (links existing accounts).
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
          tradeCredits: config.tradeCreditsStart,
        },
      });
    } else if (!user.oauthProvider) {
      // Link the OAuth identity to the existing (email-based) account.
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
