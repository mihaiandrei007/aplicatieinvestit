import type { NextFunction, Request, Response } from 'express';

/** HTTP error with a status code, to be caught by the error handler. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export const badRequest = (msg: string) => new HttpError(400, msg);
export const unauthorized = (msg = 'Not authenticated.') => new HttpError(401, msg);
export const forbidden = (msg = 'Forbidden.') => new HttpError(403, msg);
export const notFound = (msg = 'Resource not found.') => new HttpError(404, msg);
export const conflict = (msg: string) => new HttpError(409, msg);

/** Wraps an async handler so errors propagate to `next`. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/** Final error-handling middleware. */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Known domain errors (e.g. TradeError) -> 400.
  if (err instanceof Error && (err.name === 'TradeError' || err.name === 'ZodError')) {
    res.status(400).json({ error: err.message });
    return;
  }
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error.' });
}
