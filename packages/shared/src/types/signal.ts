import { AssetClass, ISODateString } from './common';
import { ScoreClassification } from '../utils/math';

export type SignalClassification = ScoreClassification;

/** One input into a composite signal score, kept transparent (never a black box). */
export interface SignalFactor {
  /** -100 (very bearish) .. +100 (very bullish) */
  score: number;
  label: string;
  detail: string;
}

export interface SignalScore {
  symbol: string;
  assetClass: AssetClass;
  /** -100 (very bearish) .. +100 (very bullish) — a weighted blend of the factors below. */
  compositeScore: number;
  classification: SignalClassification;
  technical: SignalFactor;
  explosiveDemand: SignalFactor;
  /** null when no news provider is configured, or the provider call failed/returned nothing usable. */
  newsSentiment: SignalFactor | null;
  updatedAt: ISODateString;
}

export type NewsSentiment = 'positive' | 'negative' | 'neutral';

export interface NewsHeadline {
  id: string;
  symbol: string;
  headline: string;
  source: string;
  url: string;
  sentiment: NewsSentiment;
  /** Flags lawsuit/recall/investigation/fine-type language — a lightweight controversy signal, not a real ESG score. */
  isControversy: boolean;
  publishedAt: ISODateString;
}

export interface ExplosiveCandidate {
  symbol: string;
  assetClass: AssetClass;
  /** 0 (nothing unusual) .. 100 (extreme volume + breakout + volatility expansion) */
  explosiveScore: number;
  volumeChangePercent: number;
  priceChangePercent: number;
  volatilityExpansionPercent: number;
  reason: string;
}
