import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../auth/auth.js';
import { unauthorized } from './errors.js';

/** Extends Request with the authenticated user. */
export interface AuthedRequest extends Request {
  userId?: string;
}

/** Middleware: requires a valid Bearer token and sets `req.userId`. */
export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized('Missing Bearer token.');
  }
  try {
    const payload = verifyToken(header.slice('Bearer '.length).trim());
    req.userId = payload.sub;
    next();
  } catch {
    throw unauthorized('Invalid or expired token.');
  }
}
