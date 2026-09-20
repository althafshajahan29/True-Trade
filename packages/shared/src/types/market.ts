import { Timeframe } from './common';

export interface Candle {
  symbol: string;
  timeframe: Timeframe;
  timestamp: number; // epoch ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  timestamp: number;
  changePercent24h: number;
  /** True when price/changePercent24h came from a real market data provider (Finnhub for stocks, CoinGecko for supported crypto pairs) rather than the simulated price walk. */
  isLive: boolean;
}
