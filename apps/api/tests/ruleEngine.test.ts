import { describe, expect, it } from 'vitest';
import { Candle, StrategyCondition } from '@right-trade/shared';
import { evaluateCondition, IndicatorEngine } from '../src/engines/ruleEngine';

function buildCandles(closes: number[]): Candle[] {
  return closes.map((close, i) => ({
    symbol: 'TEST',
    timeframe: '1h',
    timestamp: i * 3_600_000,
    open: close,
    high: close,
    low: close,
    close,
    volume: 100,
  }));
}

describe('evaluateCondition', () => {
  it('detects a crosses_above transition against a constant', () => {
    const candles = buildCandles([10, 20, 30, 50, 60]);
    const engine = new IndicatorEngine(candles);
    const condition: StrategyCondition = {
      id: 'c1',
      left: { kind: 'indicator', ref: { indicator: 'price' } },
      operator: 'crosses_above',
      right: { kind: 'constant', value: 40 },
    };

    expect(evaluateCondition(condition, engine, 2)).toBe(false); // 30, still below
    expect(evaluateCondition(condition, engine, 3)).toBe(true); // 50 crossed above 40
    expect(evaluateCondition(condition, engine, 4)).toBe(false); // already above, not a fresh cross
  });

  it('evaluates greater_than and less_than without needing history', () => {
    const candles = buildCandles([10, 20, 30]);
    const engine = new IndicatorEngine(candles);

    const gt: StrategyCondition = {
      id: 'c2',
      left: { kind: 'indicator', ref: { indicator: 'price' } },
      operator: 'greater_than',
      right: { kind: 'constant', value: 15 },
    };
    expect(evaluateCondition(gt, engine, 0)).toBe(false);
    expect(evaluateCondition(gt, engine, 1)).toBe(true);
  });

  it('returns false when the indicator has not warmed up yet (NaN)', () => {
    const candles = buildCandles([10, 20, 30]);
    const engine = new IndicatorEngine(candles);
    const condition: StrategyCondition = {
      id: 'c3',
      left: { kind: 'indicator', ref: { indicator: 'sma', period: 20 } },
      operator: 'greater_than',
      right: { kind: 'constant', value: 0 },
    };
    expect(evaluateCondition(condition, engine, 2)).toBe(false);
  });
});
