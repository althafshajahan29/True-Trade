import { AssetClass, Candle, ExplosiveCandidate, generateId, INSTRUMENTS, NewsHeadline, SignalScore } from '@right-trade/shared';
import { signalRepo } from '../repositories/signal.repo';
import {
  classifyScore,
  combineFactors,
  computeExplosiveCandidate,
  computeTechnicalFactor,
  explosiveCandidateToFactor,
} from '../engines/signalScore.engine';
import { classifyHeadlineSentiment, computeNewsFactor, isControversyHeadline } from '../engines/newsSentiment.engine';
import { fetchCompanyNews } from './newsProvider.service';
import { marketDataService, timeframeMs } from './marketData.service';

const LOOKBACK_CANDLES = 250;
const SIGNAL_TIMEFRAME = '1h' as const;
const MAX_HEADLINES_PER_SYMBOL = 15;

function getLookbackCandles(symbol: string): Candle[] {
  const tfMs = timeframeMs(SIGNAL_TIMEFRAME);
  const now = Math.floor(Date.now() / tfMs) * tfMs;
  const start = now - LOOKBACK_CANDLES * tfMs;
  return marketDataService.getCandles(symbol, SIGNAL_TIMEFRAME, start, now);
}

async function buildNewsFactor(symbol: string, assetClass: AssetClass) {
  // News sentiment is scoped to equities — that's where per-symbol company
  // news coverage genuinely exists (see services/newsProvider.service.ts).
  if (assetClass !== 'stocks') return null;

  const rawNews = await fetchCompanyNews(symbol);
  if (rawNews.length === 0) return null;

  const headlines: NewsHeadline[] = rawNews.slice(0, MAX_HEADLINES_PER_SYMBOL).map((item) => {
    const combinedText = `${item.headline} ${item.summary}`;
    return {
      id: generateId(),
      symbol,
      headline: item.headline,
      source: item.source,
      url: item.url,
      sentiment: classifyHeadlineSentiment(combinedText),
      isControversy: isControversyHeadline(combinedText),
      publishedAt: item.datetime > 0 ? new Date(item.datetime * 1000).toISOString() : new Date().toISOString(),
    };
  });

  signalRepo.replaceHeadlines(symbol, headlines);
  return computeNewsFactor(headlines);
}

async function refreshSymbol(symbol: string, assetClass: AssetClass): Promise<SignalScore> {
  const candles = getLookbackCandles(symbol);
  const technical = computeTechnicalFactor(candles);
  const explosiveCandidate = computeExplosiveCandidate(symbol, assetClass, candles);
  const explosiveDemand = explosiveCandidateToFactor(explosiveCandidate);
  const newsSentiment = await buildNewsFactor(symbol, assetClass);
  const compositeScore = combineFactors(technical, explosiveDemand, newsSentiment);

  const score: SignalScore = {
    symbol,
    assetClass,
    compositeScore,
    classification: classifyScore(compositeScore),
    technical,
    explosiveDemand,
    newsSentiment,
    updatedAt: new Date().toISOString(),
  };
  signalRepo.upsertScore(score);
  return score;
}

export const signalService = {
  /** Refreshes every supported instrument. Called on an interval — see index.ts. One bad symbol never blocks the rest. */
  async refreshAll(): Promise<void> {
    for (const instrument of INSTRUMENTS) {
      try {
        await refreshSymbol(instrument.symbol, instrument.assetClass);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`Signal refresh failed for ${instrument.symbol}:`, err);
      }
    }
  },

  list(): SignalScore[] {
    return signalRepo.listScores();
  },

  async getDetail(symbol: string): Promise<{ score: SignalScore; headlines: NewsHeadline[] } | null> {
    const instrument = INSTRUMENTS.find((i) => i.symbol === symbol);
    if (!instrument) return null;

    let score = signalRepo.findScore(symbol);
    if (!score) {
      // First request for this symbol before the background job has ever
      // run — compute it once, synchronously, so the user isn't staring
      // at nothing.
      score = await refreshSymbol(instrument.symbol, instrument.assetClass);
    }
    return { score, headlines: signalRepo.listHeadlines(symbol) };
  },

  /** Cross-symbol headline feed for the dashboard/Signals screen — not scoped to one symbol like getDetail's headlines. */
  recentNews(limit = 30): NewsHeadline[] {
    return signalRepo.listRecentHeadlines(limit);
  },

  listExplosiveCandidates(limit = 5): ExplosiveCandidate[] {
    const candidates = INSTRUMENTS.map((i) => computeExplosiveCandidate(i.symbol, i.assetClass, getLookbackCandles(i.symbol))).filter(
      (c): c is ExplosiveCandidate => c !== null,
    );
    candidates.sort((a, b) => b.explosiveScore - a.explosiveScore);
    return candidates.slice(0, limit);
  },
};
