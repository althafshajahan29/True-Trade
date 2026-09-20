import path from 'node:path';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'right-trade-dev-secret-do-not-use-in-production',
  jwtExpiresInSeconds: 60 * 60 * 24 * 7, // 7 days
  dbPath: process.env.DB_PATH ?? path.join(__dirname, '..', 'data', 'right-trade.db'),
  botTickIntervalMs: Number(process.env.BOT_TICK_INTERVAL_MS ?? 15_000),
  isTest: process.env.NODE_ENV === 'test',
  // Optional: enables real news-headline sentiment as a third signal factor.
  // Get a free key at finnhub.io — without it, news sentiment is simply
  // omitted (the composite score reweights across the remaining factors).
  newsApiKey: process.env.FINNHUB_API_KEY ?? '',
  signalRefreshIntervalMs: Number(process.env.SIGNAL_REFRESH_INTERVAL_MS ?? 3 * 60_000),
  // How often to poll real quotes (Finnhub for stocks, CoinGecko for
  // supported crypto pairs) — comfortably under both providers' free-tier
  // rate limits even with ~20 tracked symbols.
  liveQuoteRefreshIntervalMs: Number(process.env.LIVE_QUOTE_REFRESH_INTERVAL_MS ?? 30_000),
};
