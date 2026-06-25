import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/auth.js';
import { unauthorized } from './errors.js';

/** Extinde Request cu utilizatorul autentificat. */
export interface AuthedRequest extends Request {
  userId?: string;
}

/** Middleware: cere un token Bearer valid și pune `req.userId`. */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized('Lipsește token-ul Bearer.');
  }
  try {
    const payload = verifyToken(header.slice('Bearer '.length).trim());
    req.userId = payload.sub;
    next();
  } catch {
    throw unauthorized('Token invalid sau expirat.');
  }
}
