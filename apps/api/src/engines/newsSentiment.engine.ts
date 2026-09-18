import { NewsSentiment, round, SignalFactor } from '@right-trade/shared';

// Deliberately simple and transparent (a plain keyword scan) rather than a
// black-box model — every classification can be explained by which words
// matched. Good enough to separate "clearly positive/negative" headlines
// from noise; not a substitute for actually reading the news.
const POSITIVE_KEYWORDS = [
  'surge', 'surges', 'soar', 'soars', 'beat', 'beats', 'record', 'upgrade', 'upgraded',
  'rally', 'rallies', 'jump', 'jumps', 'outperform', 'strong', 'growth', 'profit', 'profits',
  'gain', 'gains', 'bullish', 'breakthrough', 'partnership', 'approval', 'approved', 'expand',
  'expansion', 'raise', 'raised', 'raises', 'buyback', 'wins', 'win', 'boost', 'boosts',
  'exceeds', 'optimistic', 'upbeat',
];

const NEGATIVE_KEYWORDS = [
  'plunge', 'plunges', 'miss', 'misses', 'downgrade', 'downgraded', 'crash', 'crashes',
  'lawsuit', 'recall', 'fraud', 'investigation', 'bankruptcy', 'layoff', 'layoffs', 'decline',
  'declines', 'loss', 'losses', 'bearish', 'warning', 'cut', 'cuts', 'delay', 'delayed',
  'sued', 'fine', 'fined', 'scandal', 'plummet', 'plummets', 'slump', 'slumps', 'weak',
  'concern', 'concerns', 'probe', 'halted', 'default',
];

// A subset of negative language specifically about legal/regulatory/ethical
// trouble — governance, labor, environmental, or compliance issues — rather
// than plain business underperformance. This is a keyword flag, not a real
// ESG controversy score (those come from paid data providers).
const CONTROVERSY_KEYWORDS = [
  'lawsuit', 'sued', 'fraud', 'investigation', 'probe', 'recall', 'fine', 'fined', 'scandal',
  'violation', 'discrimination', 'harassment', 'bribery', 'corruption', 'spill', 'contamination',
  'safety', 'whistleblower', 'antitrust', 'settlement', 'misconduct', 'penalty', 'sanction', 'sanctions',
];

export function classifyHeadlineSentiment(text: string): NewsSentiment {
  const lower = text.toLowerCase();
  let score = 0;
  for (const word of POSITIVE_KEYWORDS) {
    if (lower.includes(word)) score += 1;
  }
  for (const word of NEGATIVE_KEYWORDS) {
    if (lower.includes(word)) score -= 1;
  }
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

export function isControversyHeadline(text: string): boolean {
  const lower = text.toLowerCase();
  return CONTROVERSY_KEYWORDS.some((word) => lower.includes(word));
}

export function computeNewsFactor(headlines: { sentiment: NewsSentiment }[]): SignalFactor {
  if (headlines.length === 0) {
    return {
      score: 0,
      label: 'No recent news',
      detail: 'No recent headlines were found for this symbol.',
    };
  }

  const positive = headlines.filter((h) => h.sentiment === 'positive').length;
  const negative = headlines.filter((h) => h.sentiment === 'negative').length;
  const neutral = headlines.length - positive - negative;
  const score = round(((positive - negative) / headlines.length) * 100, 1);
  const label = score > 30 ? 'Positive news flow' : score < -30 ? 'Negative news flow' : 'Mixed/neutral news flow';

  return {
    score,
    label,
    detail: `${positive} positive, ${negative} negative, ${neutral} neutral of ${headlines.length} recent headlines.`,
  };
}
