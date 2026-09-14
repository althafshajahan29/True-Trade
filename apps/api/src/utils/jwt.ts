import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthTokenPayload {
  userId: string;
}

export function signAuthToken(userId: string): string {
  return jwt.sign({ userId } satisfies AuthTokenPayload, config.jwtSecret, {
    expiresIn: config.jwtExpiresInSeconds,
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}

export function tokenExpiresAtIso(): string {
  return new Date(Date.now() + config.jwtExpiresInSeconds * 1000).toISOString();
}
