export type ISODateString = string;
export type UUID = string;

export type AssetClass = 'crypto' | 'forex' | 'stocks' | 'indices' | 'commodities';

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export type PositionDirection = 'long' | 'short';

export type Currency = 'USD' | 'EUR' | 'GBP';

export interface Instrument {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  priceDecimals: number;
}
