import { Instrument, Timeframe } from './types/common';

export const SUPPORTED_TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'BTC/USD', name: 'Bitcoin', assetClass: 'crypto', priceDecimals: 2 },
  { symbol: 'ETH/USD', name: 'Ethereum', assetClass: 'crypto', priceDecimals: 2 },
  { symbol: 'SOL/USD', name: 'Solana', assetClass: 'crypto', priceDecimals: 2 },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex', priceDecimals: 5 },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', assetClass: 'forex', priceDecimals: 5 },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', assetClass: 'forex', priceDecimals: 3 },
  { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'SPX500', name: 'S&P 500 Index', assetClass: 'indices', priceDecimals: 2 },
  { symbol: 'XAU/USD', name: 'Gold', assetClass: 'commodities', priceDecimals: 2 },
];

export const DEFAULT_INITIAL_BALANCE = 10000;
