import rateLimit from 'express-rate-limit';

/** General limiter (all routes): 300 requests / minute / IP. */
export const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again shortly.' },
});

/** Strict limiter for "expensive" actions (trades, predictions): 30 / minute / IP. */
export const actionLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many rapid actions. Take a short break.' },
});

/** Authentication limiter (anti brute-force): 10 / 5 min / IP. */
export const authLimiter = rateLimit({
  windowMs: 5 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Wait a few minutes.' },
});
