import { Candle, INSTRUMENTS, AssetClass, Quote, Timeframe } from '@right-trade/shared';
import { candleRepo } from '../repositories/candle.repo';
import { ValidationError } from '../utils/errors';
import { getCachedRealQuote } from './liveQuote.service';

const WARMUP_CANDLES = 300;

const TIMEFRAME_MS: Record<Timeframe, number> = {
  '1m': 60_000,
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '4h': 4 * 60 * 60_000,
  '1d': 24 * 60 * 60_000,
};

export const MAX_CANDLES_PER_REQUEST = 5000;

const BASE_PRICES: Record<string, number> = {
  'BTC/USD': 62000,
  'ETH/USD': 3200,
  'SOL/USD': 145,
  'EUR/USD': 1.08,
  'GBP/USD': 1.27,
  'USD/JPY': 151.4,
  AAPL: 189,
  TSLA: 245,
  NVDA: 880,
  MSFT: 425,
  GOOGL: 165,
  AMZN: 185,
  META: 560,
  AMD: 145,
  NFLX: 680,
  JPM: 210,
  V: 275,
  DIS: 95,
  INTC: 22,
  ORCL: 145,
  CRM: 260,
  BA: 180,
  WMT: 68,
  JNJ: 155,
  SPX500: 5200,
  'XAU/USD': 2320,
};

const VOLATILITY: Record<AssetClass, number> = {
  crypto: 0.018,
  forex: 0.0035,
  stocks: 0.011,
  indices: 0.007,
  commodities: 0.009,
};

function assetClassOf(symbol: string): AssetClass {
  return INSTRUMENTS.find((i) => i.symbol === symbol)?.assetClass ?? 'crypto';
}

function basePriceFor(symbol: string): number {
  return BASE_PRICES[symbol] ?? 100;
}

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0) || 1;
}

/** mulberry32 — small, fast, deterministic PRNG. */
function mulberry32(seed: number) {
  let a = seed;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function timeframeMs(timeframe: Timeframe): number {
  return TIMEFRAME_MS[timeframe];
}

// Fixed reference point used only to derive a stable "cycle phase" and RNG
// offset for any given timestamp — it does NOT imply candles are generated
// all the way back to this date (see `ensureGenerated`, which anchors the
// actual walk near the caller's requested window to keep generation cost
// bounded).
const PHASE_EPOCH_MS = Date.UTC(2020, 0, 1);

/** How strongly price is pulled back toward the symbol's base price each step, preventing an unbounded drift over long random walks. */
const MEAN_REVERSION_STRENGTH = 0.03;

/**
 * Generates and persists any missing candles for [symbol, timeframe] up to
 * `upToMs`, chained as a seeded mean-reverting random walk. When no candles
 * exist yet for this symbol/timeframe, generation starts a small warmup
 * window before `fromMs` (rather than an arbitrary historical genesis) so a
 * single request can never trigger an unbounded backfill.
 */
function ensureGenerated(symbol: string, timeframe: Timeframe, fromMs: number, upToMs: number): void {
  const tfMs = timeframeMs(timeframe);
  const latest = candleRepo.findLatest(symbol, timeframe);

  let cursorMs: number;
  let prevClose: number;
  if (latest) {
    if (latest.timestamp >= upToMs) return;
    cursorMs = latest.timestamp + tfMs;
    prevClose = latest.close;
  } else {
    cursorMs = fromMs - WARMUP_CANDLES * tfMs;
    prevClose = basePriceFor(symbol);
  }

  const basePrice = basePriceFor(symbol);
  const seed = hashSeed(`${symbol}:${timeframe}`);
  const volatility = VOLATILITY[assetClassOf(symbol)];

  const batch: Candle[] = [];
  while (cursorMs <= upToMs) {
    const index = Math.round((cursorMs - PHASE_EPOCH_MS) / tfMs);
    const rng = mulberry32(seed + index + 1);
    const cycle = Math.sin(index / 500) * volatility * 0.4;
    const microCycle = Math.sin(index / 60 + seed) * volatility * 0.15;
    const reversion = ((basePrice - prevClose) / basePrice) * MEAN_REVERSION_STRENGTH;
    const change = (rng() - 0.5) * 2 * volatility + cycle + microCycle + reversion;
    const close = Math.max(prevClose * (1 + change), 0.0001);
    const open = prevClose;
    const wickBase = Math.abs(close - open) * (0.4 + rng() * 0.9) + open * volatility * 0.15 * rng();
    const high = Math.max(open, close) + wickBase * rng();
    const low = Math.max(Math.min(open, close) - wickBase * rng(), 0.0001);
    const volume = round(400 + rng() * 4600, 2);

    batch.push({
      symbol,
      timeframe,
      timestamp: cursorMs,
      open: round(open),
      high: round(high),
      low: round(low),
      close: round(close),
      volume,
    });

    prevClose = close;
    cursorMs += tfMs;
  }

  if (batch.length > 0) candleRepo.insertMany(batch);
}

// In-memory "live" price used by the paper trading tick loop — advances a
// little each call so running bots see continuously moving quotes without
// needing to materialize a huge 1-minute candle history in the DB.
const livePrices = new Map<string, { price: number; rng: () => number }>();

function getLiveState(symbol: string) {
  let state = livePrices.get(symbol);
  if (!state) {
    const latestHour = candleRepo.findLatest(symbol, '1h');
    const startPrice = latestHour?.close ?? basePriceFor(symbol);
    state = { price: startPrice, rng: mulberry32(hashSeed(`${symbol}:live`) + Date.now() % 1000) };
    livePrices.set(symbol, state);
  }
  return state;
}

export const marketDataService = {
  listInstruments() {
    return INSTRUMENTS;
  },

  getCandles(symbol: string, timeframe: Timeframe, startMs: number, endMs: number): Candle[] {
    if (endMs <= startMs) {
      throw new ValidationError('endDate must be after startDate');
    }
    const count = Math.ceil((endMs - startMs) / timeframeMs(timeframe));
    if (count > MAX_CANDLES_PER_REQUEST) {
      throw new ValidationError(
        `Requested range produces ${count} candles, which exceeds the ${MAX_CANDLES_PER_REQUEST} limit for this timeframe. Choose a shorter range or a larger timeframe.`,
      );
    }
    ensureGenerated(symbol, timeframe, startMs, endMs);
    return candleRepo.findRange(symbol, timeframe, startMs, endMs);
  },

  /**
   * Returns a "live" quote — used by both the /market/quote route and the
   * paper trading engine's tick loop. Prefers a real, recently-fetched price
   * (see liveQuote.service) for symbols that support one; falls back to the
   * simulated random-walk price otherwise, or if the real quote is stale.
   */
  getLiveQuote(symbol: string): Quote {
    const real = getCachedRealQuote(symbol);
    if (real) {
      const spread = real.price * 0.0004;
      return {
        symbol,
        price: round(real.price, 5),
        bid: round(real.price - spread / 2, 5),
        ask: round(real.price + spread / 2, 5),
        timestamp: Date.now(),
        changePercent24h: round(real.changePercent24h, 2),
        isLive: true,
      };
    }

    const state = getLiveState(symbol);
    const volatility = VOLATILITY[assetClassOf(symbol)];
    const change = (state.rng() - 0.5) * 2 * volatility * 0.5;
    state.price = Math.max(state.price * (1 + change), 0.0001);
    const spread = state.price * 0.0004;
    return {
      symbol,
      price: round(state.price, 5),
      bid: round(state.price - spread / 2, 5),
      ask: round(state.price + spread / 2, 5),
      timestamp: Date.now(),
      changePercent24h: round(change * 100 * 48, 2),
      isLive: false,
    };
  },
};
