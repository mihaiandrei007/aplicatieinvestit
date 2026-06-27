import rateLimit from 'express-rate-limit';

/** Limitator general (toate rutele): 300 cereri / minut / IP. */
export const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe cereri. Încearcă din nou în scurt timp.' },
});

/** Limitator strict pentru acțiuni „costisitoare" (trade, predicții): 30 / minut / IP. */
export const actionLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe acțiuni rapide. Ia o pauză scurtă.' },
});

/** Limitator pentru autentificare (anti brute-force): 10 / 5 min / IP. */
export const authLimiter = rateLimit({
  windowMs: 5 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe încercări. Așteaptă câteva minute.' },
});
