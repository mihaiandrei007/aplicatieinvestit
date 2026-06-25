/** Helperi de autentificare: hashing parolă (bcrypt) + JWT. Izolate de rute. */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface JwtPayload {
  /** ID-ul utilizatorului (subiectul token-ului). */
  sub: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId: string): string {
  const options: jwt.SignOptions = { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] };
  return jwt.sign({ sub: userId }, config.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwtSecret);
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Token invalid.');
  }
  return { sub: decoded.sub };
}
