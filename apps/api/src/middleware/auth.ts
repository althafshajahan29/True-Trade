import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { verifyAuthToken } from '../utils/jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new UnauthorizedError();
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = verifyAuthToken(token);
    req.userId = payload.userId;
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired session. Please sign in again.');
  }
}
