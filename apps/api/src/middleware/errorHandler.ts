import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiErrorBody } from '@right-trade/shared';
import { AppError } from '../utils/errors';

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorBody = {
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` },
  };
  res.status(404).json(body);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      error: { code: err.code, message: err.message, details: err.details },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of err.issues) {
      details[issue.path.join('.') || 'value'] = issue.message;
    }
    const body: ApiErrorBody = {
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details },
    };
    res.status(400).json(body);
    return;
  }

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  const body: ApiErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' },
  };
  res.status(500).json(body);
}
