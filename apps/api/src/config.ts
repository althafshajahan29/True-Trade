import path from 'node:path';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'right-trade-dev-secret-do-not-use-in-production',
  jwtExpiresInSeconds: 60 * 60 * 24 * 7, // 7 days
  dbPath: process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'right-trade.db'),
  botTickIntervalMs: Number(process.env.BOT_TICK_INTERVAL_MS ?? 15_000),
  isTest: process.env.NODE_ENV === 'test',
};
