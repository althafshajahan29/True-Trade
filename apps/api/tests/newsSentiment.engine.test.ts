import { describe, expect, it } from 'vitest';
import { classifyHeadlineSentiment, computeNewsFactor, isControversyHeadline } from '../src/engines/newsSentiment.engine';

describe('classifyHeadlineSentiment', () => {
  it('classifies clearly positive headlines', () => {
    expect(classifyHeadlineSentiment('Company beats earnings expectations, shares surge')).toBe('positive');
  });

  it('classifies clearly negative headlines', () => {
    expect(classifyHeadlineSentiment('Company misses estimates as shares plunge after lawsuit')).toBe('negative');
  });

  it('classifies headlines with no matching keywords as neutral', () => {
    expect(classifyHeadlineSentiment('Company to present at investor conference next week')).toBe('neutral');
  });
});

describe('isControversyHeadline', () => {
  it('flags legal/regulatory language', () => {
    expect(isControversyHeadline('Company faces federal investigation over safety violations')).toBe(true);
  });

  it('does not flag ordinary business news', () => {
    expect(isControversyHeadline('Company reports quarterly revenue growth')).toBe(false);
  });
});

describe('computeNewsFactor', () => {
  it('returns a neutral zero-score factor with no headlines', () => {
    const factor = computeNewsFactor([]);
    expect(factor.score).toBe(0);
    expect(factor.label).toBe('No recent news');
  });

  it('scores positive when headlines skew positive', () => {
    const factor = computeNewsFactor([{ sentiment: 'positive' }, { sentiment: 'positive' }, { sentiment: 'neutral' }]);
    expect(factor.score).toBeGreaterThan(0);
  });

  it('scores negative when headlines skew negative', () => {
    const factor = computeNewsFactor([{ sentiment: 'negative' }, { sentiment: 'negative' }, { sentiment: 'positive' }]);
    expect(factor.score).toBeLessThan(0);
  });
});
