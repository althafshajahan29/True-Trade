import { describe, expect, it } from 'vitest';
import { Candle } from '@right-trade/shared';
import {
  classifyScore,
  combineFactors,
  computeExplosiveCandidate,
  computeTechnicalFactor,
  explosiveCandidateToFactor,
} from '../src/engines/signalScore.engine';

function buildCandles(closes: number[], volumes?: number[]): Candle[] {
  return closes.map((close, i) => ({
    symbol: 'TEST',
    timeframe: '1h',
    timestamp: i * 3_600_000,
    open: close,
    high: close * 1.01,
    low: close * 0.99,
    close,
    volume: volumes ? volumes[i]! : 1000,
  }));
}

describe('computeTechnicalFactor', () => {
  it('returns a neutral/insufficient-data factor with too few candles', () => {
    const factor = computeTechnicalFactor(buildCandles([100, 101, 102]));
    expect(factor.score).toBe(0);
    expect(factor.label).toBe('Not enough data');
  });

  it('scores a sustained uptrend as bullish', () => {
    const closes = Array.from({ length: 80 }, (_, i) => 100 + i * 1.5);
    const factor = computeTechnicalFactor(buildCandles(closes));
    expect(factor.score).toBeGreaterThan(0);
  });

  it('scores a sustained downtrend as bearish', () => {
    const closes = Array.from({ length: 80 }, (_, i) => 200 - i * 1.5);
    const factor = computeTechnicalFactor(buildCandles(closes));
    expect(factor.score).toBeLessThan(0);
  });
});

describe('computeExplosiveCandidate', () => {
  it('returns null with too little history', () => {
    const result = computeExplosiveCandidate('TEST', 'crypto', buildCandles([100, 101, 102]));
    expect(result).toBeNull();
  });

  it('flags a volume + price spike as explosive', () => {
    const baselineCloses = Array.from({ length: 20 }, () => 100);
    const baselineVolumes = Array.from({ length: 20 }, () => 1000);
    const spikeCloses = [110, 115, 120, 125, 130];
    const spikeVolumes = [5000, 6000, 7000, 8000, 9000];

    const candles = buildCandles([...baselineCloses, ...spikeCloses], [...baselineVolumes, ...spikeVolumes]);
    const result = computeExplosiveCandidate('TEST', 'crypto', candles);

    expect(result).not.toBeNull();
    expect(result!.explosiveScore).toBeGreaterThan(50);
    expect(result!.volumeChangePercent).toBeGreaterThan(0);
    expect(result!.priceChangePercent).toBeGreaterThan(0);
  });

  it('reports low explosiveness for flat, unremarkable price/volume', () => {
    const candles = buildCandles(Array.from({ length: 30 }, () => 100));
    const result = computeExplosiveCandidate('TEST', 'crypto', candles);
    expect(result).not.toBeNull();
    expect(result!.explosiveScore).toBeLessThan(10);
  });
});

describe('explosiveCandidateToFactor', () => {
  it('returns an insufficient-data factor for null input', () => {
    const factor = explosiveCandidateToFactor(null);
    expect(factor.score).toBe(0);
    expect(factor.label).toBe('Not enough data');
  });

  it('makes the factor score negative when the breakout is to the downside', () => {
    const factor = explosiveCandidateToFactor({
      symbol: 'TEST',
      assetClass: 'crypto',
      explosiveScore: 80,
      volumeChangePercent: 200,
      priceChangePercent: -15,
      volatilityExpansionPercent: 100,
      reason: 'volume up 200%',
    });
    expect(factor.score).toBeLessThan(0);
  });
});

describe('classifyScore', () => {
  it('maps scores to classifications at the documented boundaries', () => {
    expect(classifyScore(75)).toBe('strong_bullish');
    expect(classifyScore(30)).toBe('bullish');
    expect(classifyScore(0)).toBe('neutral');
    expect(classifyScore(-30)).toBe('bearish');
    expect(classifyScore(-75)).toBe('strong_bearish');
  });
});

describe('combineFactors', () => {
  const bullishTechnical = { score: 80, label: '', detail: '' };
  const bullishExplosive = { score: 40, label: '', detail: '' };
  const bearishNews = { score: -60, label: '', detail: '' };

  it('reweights across remaining factors when news is unavailable', () => {
    const withNews = combineFactors(bullishTechnical, bullishExplosive, bearishNews);
    const withoutNews = combineFactors(bullishTechnical, bullishExplosive, null);
    // Removing a strongly negative factor should raise the composite score.
    expect(withoutNews).toBeGreaterThan(withNews);
  });

  it('stays within -100..100', () => {
    const score = combineFactors({ score: 100, label: '', detail: '' }, { score: 100, label: '', detail: '' }, { score: 100, label: '', detail: '' });
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(-100);
  });
});
