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
  { symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'META', name: 'Meta Platforms Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'AMD', name: 'Advanced Micro Devices', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'NFLX', name: 'Netflix Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'V', name: 'Visa Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'DIS', name: 'The Walt Disney Company', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'INTC', name: 'Intel Corp.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'ORCL', name: 'Oracle Corp.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'CRM', name: 'Salesforce Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'BA', name: 'Boeing Co.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'WMT', name: 'Walmart Inc.', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'JNJ', name: 'Johnson & Johnson', assetClass: 'stocks', priceDecimals: 2 },
  { symbol: 'SPX500', name: 'S&P 500 Index', assetClass: 'indices', priceDecimals: 2 },
  { symbol: 'XAU/USD', name: 'Gold', assetClass: 'commodities', priceDecimals: 2 },
];

export const DEFAULT_INITIAL_BALANCE = 10000;
