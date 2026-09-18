import {
  AssetClass,
  average,
  Candle,
  ExplosiveCandidate,
  round,
  SignalClassification,
  SignalFactor,
} from '@right-trade/shared';
import { macd, rsi, sma } from './indicators';

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

const INSUFFICIENT_DATA_FACTOR: SignalFactor = {
  score: 0,
  label: 'Not enough data',
  detail: 'Needs more price history to warm up before this factor means anything.',
};

/**
 * A momentum score derived purely from technical indicators (RSI, MACD,
 * price vs. a 50-period average) computed on our own candle data — no
 * external dependency, works for every symbol we already support.
 */
export function computeTechnicalFactor(candles: Candle[]): SignalFactor {
  if (candles.length < 30) return INSUFFICIENT_DATA_FACTOR;

  const closes = candles.map((c) => c.close);
  const rsiSeries = rsi(closes, 14);
  const { macd: macdSeries, signal: signalSeries } = macd(closes);
  const smaSeries = sma(closes, 50);

  const lastIndex = candles.length - 1;
  const lastRsi = rsiSeries[lastIndex]!;
  const lastMacd = macdSeries[lastIndex]!;
  const lastSignal = signalSeries[lastIndex]!;
  const lastPrice = closes[lastIndex]!;
  const lastSma = smaSeries[lastIndex]!;

  const parts: number[] = [];
  const notes: string[] = [];

  if (!Number.isNaN(lastRsi)) {
    parts.push(clamp((lastRsi - 50) * 2, -100, 100));
    notes.push(`RSI ${lastRsi.toFixed(0)}`);
  }

  if (!Number.isNaN(lastMacd) && !Number.isNaN(lastSignal) && lastPrice > 0) {
    const macdDiffPct = ((lastMacd - lastSignal) / lastPrice) * 100;
    parts.push(clamp(macdDiffPct * 4000, -100, 100));
    notes.push(lastMacd > lastSignal ? 'MACD above signal line' : 'MACD below signal line');
  }

  if (!Number.isNaN(lastSma) && lastSma > 0) {
    const trendPct = ((lastPrice - lastSma) / lastSma) * 100;
    parts.push(clamp(trendPct * 10, -100, 100));
    notes.push(lastPrice > lastSma ? 'price above its 50-period average' : 'price below its 50-period average');
  }

  if (parts.length === 0) return INSUFFICIENT_DATA_FACTOR;

  const score = round(average(parts), 1);
  const label = score > 30 ? 'Bullish momentum' : score < -30 ? 'Bearish momentum' : 'Neutral momentum';
  return { score, label, detail: `${notes.join(', ')}.` };
}

/**
 * Flags unusual volume + price + volatility activity by comparing a recent
 * short window against a preceding baseline window. This is a heuristic
 * breakout screener, not a prediction — it answers "is something unusual
 * happening right now", not "will it keep happening".
 */
export function computeExplosiveCandidate(
  symbol: string,
  assetClass: AssetClass,
  candles: Candle[],
): ExplosiveCandidate | null {
  const recentWindow = 5;
  const baselineWindow = 20;
  if (candles.length < recentWindow + baselineWindow) return null;

  const recent = candles.slice(-recentWindow);
  const baseline = candles.slice(-(recentWindow + baselineWindow), -recentWindow);
  if (baseline.length === 0) return null;

  const baselineAvgVolume = average(baseline.map((c) => c.volume));
  const recentAvgVolume = average(recent.map((c) => c.volume));
  const volumeChangePercent = baselineAvgVolume > 0 ? round(((recentAvgVolume - baselineAvgVolume) / baselineAvgVolume) * 100, 1) : 0;

  const startPrice = baseline[0]!.close;
  const endPrice = recent[recent.length - 1]!.close;
  const priceChangePercent = startPrice > 0 ? round(((endPrice - startPrice) / startPrice) * 100, 2) : 0;

  const baselineRanges = baseline.map((c) => (c.high - c.low) / c.close);
  const recentRanges = recent.map((c) => (c.high - c.low) / c.close);
  const baselineVolatility = average(baselineRanges);
  const recentVolatility = average(recentRanges);
  const volatilityExpansionPercent =
    baselineVolatility > 0 ? round(((recentVolatility - baselineVolatility) / baselineVolatility) * 100, 1) : 0;

  const volumeComponent = clamp(volumeChangePercent, 0, 300) / 3;
  const priceComponent = clamp(priceChangePercent, 0, 30) * (100 / 30);
  const volatilityComponent = clamp(volatilityExpansionPercent, 0, 200) / 2;
  const explosiveScore = round(volumeComponent * 0.4 + priceComponent * 0.4 + volatilityComponent * 0.2, 1);

  const reasonParts: string[] = [];
  if (volumeChangePercent > 30) reasonParts.push(`volume up ${volumeChangePercent}%`);
  if (priceChangePercent > 3) reasonParts.push(`price up ${priceChangePercent}%`);
  if (volatilityExpansionPercent > 30) reasonParts.push('volatility expanding');
  const reason = reasonParts.length > 0 ? reasonParts.join(', ') : 'No unusual activity detected right now.';

  return { symbol, assetClass, explosiveScore, volumeChangePercent, priceChangePercent, volatilityExpansionPercent, reason };
}

export function explosiveCandidateToFactor(candidate: ExplosiveCandidate | null): SignalFactor {
  if (!candidate) return INSUFFICIENT_DATA_FACTOR;
  // Explosive score is unsigned (0-100 "how unusual"); direction comes from price change.
  const directional = candidate.priceChangePercent >= 0 ? candidate.explosiveScore : -candidate.explosiveScore;
  return {
    score: round(clamp(directional, -100, 100), 1),
    label: candidate.explosiveScore > 60 ? 'Explosive activity' : candidate.explosiveScore > 30 ? 'Elevated activity' : 'Normal activity',
    detail: candidate.reason,
  };
}

export function classifyScore(score: number): SignalClassification {
  if (score >= 60) return 'strong_bullish';
  if (score >= 20) return 'bullish';
  if (score <= -60) return 'strong_bearish';
  if (score <= -20) return 'bearish';
  return 'neutral';
}

/**
 * Blends the available factors into one composite score. When news
 * sentiment isn't available (no API key configured, or the call failed),
 * weight is redistributed across the remaining factors rather than
 * silently treating "no data" as "neutral" — a missing factor should not
 * quietly drag the score toward the middle.
 */
export function combineFactors(
  technical: SignalFactor,
  explosiveDemand: SignalFactor,
  newsSentiment: SignalFactor | null,
): number {
  const weighted: { factor: SignalFactor; weight: number }[] = newsSentiment
    ? [
        { factor: technical, weight: 0.5 },
        { factor: explosiveDemand, weight: 0.2 },
        { factor: newsSentiment, weight: 0.3 },
      ]
    : [
        { factor: technical, weight: 0.65 },
        { factor: explosiveDemand, weight: 0.35 },
      ];

  const totalWeight = weighted.reduce((acc, w) => acc + w.weight, 0);
  const sum = weighted.reduce((acc, w) => acc + w.factor.score * w.weight, 0);
  return round(sum / totalWeight, 1);
}
