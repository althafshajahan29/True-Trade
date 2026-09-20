import { AssetClass } from '@right-trade/shared';
import { config } from '../config';

interface RealQuote {
  price: number;
  changePercent24h: number;
}

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const REQUEST_TIMEOUT_MS = 6000;
/** Real quotes are cached this long — long enough to stay well under free-tier rate limits even with the bot tick loop polling every few seconds, short enough to still feel live. */
const CACHE_TTL_MS = 45_000;

const COINGECKO_IDS: Record<string, string> = {
  'BTC/USD': 'bitcoin',
  'ETH/USD': 'ethereum',
  'SOL/USD': 'solana',
};

const cache = new Map<string, { quote: RealQuote; fetchedAt: number }>();

async function fetchJson(url: string): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchStockQuote(symbol: string): Promise<RealQuote | null> {
  if (!config.newsApiKey) return null; // reuses the Finnhub key — same provider, same key
  const data = await fetchJson(`${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${config.newsApiKey}`);
  if (!data || typeof data !== 'object') return null;
  const { c: price, dp: changePercent } = data as Record<string, unknown>;
  if (typeof price !== 'number' || price <= 0) return null;
  return { price, changePercent24h: typeof changePercent === 'number' ? changePercent : 0 };
}

async function fetchCryptoQuote(symbol: string): Promise<RealQuote | null> {
  const id = COINGECKO_IDS[symbol];
  if (!id) return null;
  const data = await fetchJson(`${COINGECKO_BASE}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`);
  if (!data || typeof data !== 'object') return null;
  const entry = (data as Record<string, unknown>)[id];
  if (!entry || typeof entry !== 'object') return null;
  const { usd: price, usd_24h_change: changePercent } = entry as Record<string, unknown>;
  if (typeof price !== 'number' || price <= 0) return null;
  return { price, changePercent24h: typeof changePercent === 'number' ? changePercent : 0 };
}

export function isLiveQuoteSupported(assetClass: AssetClass): boolean {
  return assetClass === 'stocks' || assetClass === 'crypto';
}

/**
 * Synchronous read of whatever real quote is currently cached for a symbol
 * — never triggers a fetch itself, so it's safe to call from the
 * synchronous getLiveQuote() the paper-trading tick loop relies on. Returns
 * null if nothing's cached yet or the cached value has gone stale.
 */
export function getCachedRealQuote(symbol: string): RealQuote | null {
  const cached = cache.get(symbol);
  if (!cached || Date.now() - cached.fetchedAt >= CACHE_TTL_MS) return null;
  return cached.quote;
}

/**
 * Refreshes the real-quote cache for one symbol from a free public provider
 * (Finnhub for stocks, CoinGecko for the crypto pairs it covers). No-ops for
 * anything unsupported (forex/commodities/indices have no reliable free
 * real-time source) and fails closed on any fetch error — the cache simply
 * keeps whatever it last had (or stays empty) rather than surfacing an error.
 * Called on an interval — see index.ts — not from request handlers, so the
 * simple synchronous cache read above never blocks on network I/O.
 */
export async function refreshRealQuote(symbol: string, assetClass: AssetClass): Promise<void> {
  if (!isLiveQuoteSupported(assetClass)) return;
  const quote = assetClass === 'stocks' ? await fetchStockQuote(symbol) : await fetchCryptoQuote(symbol);
  if (quote) cache.set(symbol, { quote, fetchedAt: Date.now() });
}
