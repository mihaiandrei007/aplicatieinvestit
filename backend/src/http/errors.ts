import type { NextFunction, Request, Response } from 'express';

/** Eroare HTTP cu cod de status, pentru a fi prinsă de error handler. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (msg: string) => new HttpError(400, msg);
export const unauthorized = (msg = 'Neautentificat.') => new HttpError(401, msg);
export const forbidden = (msg = 'Interzis.') => new HttpError(403, msg);
export const notFound = (msg = 'Resursă inexistentă.') => new HttpError(404, msg);
export const conflict = (msg: string) => new HttpError(409, msg);

/** Înfășoară un handler async ca să propage erorile spre `next`. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/** Middleware final de tratare a erorilor. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Erori de domeniu cunoscute (ex. TradeError) -> 400.
  if (err instanceof Error && (err.name === 'TradeError' || err.name === 'ZodError')) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error('Eroare neașteptată:', err);
  res.status(500).json({ error: 'Eroare internă de server.' });
}
