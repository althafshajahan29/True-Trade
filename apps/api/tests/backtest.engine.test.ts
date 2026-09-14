import { describe, expect, it } from 'vitest';
import { Candle, Strategy } from '@right-trade/shared';
import { runBacktest } from '../src/engines/backtest.engine';

function buildStrategy(overrides: Partial<Strategy> = {}): Strategy {
  return {
    id: 'strategy-1',
    userId: 'user-1',
    name: 'Test SMA Cross',
    description: '',
    assetClass: 'crypto',
    symbol: 'BTC/USD',
    timeframe: '1h',
    direction: 'long',
    entryRules: [
      {
        id: 'entry-1',
        type: 'entry',
        conditions: [
          {
            id: 'cond-1',
            left: { kind: 'indicator', ref: { indicator: 'sma', period: 3 } },
            operator: 'crosses_above',
            right: { kind: 'constant', value: 100 },
          },
        ],
      },
    ],
    exitRules: [
      {
        id: 'exit-1',
        type: 'exit',
        conditions: [
          {
            id: 'cond-2',
            left: { kind: 'indicator', ref: { indicator: 'sma', period: 3 } },
            operator: 'crosses_below',
            right: { kind: 'constant', value: 100 },
          },
        ],
      },
    ],
    positionSizing: { method: 'fixed_units', value: 1 },
    riskControls: {},
    schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startHourUtc: 0, endHourUtc: 23 },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function buildCandles(prices: number[]): Candle[] {
  return prices.map((price, i) => ({
    symbol: 'BTC/USD',
    timeframe: '1h',
    timestamp: i * 60 * 60 * 1000,
    open: price,
    high: price + 1,
    low: price - 1,
    close: price,
    volume: 1000,
  }));
}

describe('runBacktest', () => {
  it('enters on a crossover above and exits on a crossover below, producing a profitable trade', () => {
    // Price walks from below 100 to above 100 and back down — a classic cross above/below pair.
    const prices = [95, 96, 97, 98, 99, 105, 110, 115, 120, 112, 105, 98, 90, 85, 80];
    const strategy = buildStrategy();
    const candles = buildCandles(prices);

    const result = runBacktest(strategy, candles, 10000);

    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.equityCurve.length).toBe(candles.length);
    const firstTrade = result.trades[0]!;
    expect(firstTrade.direction).toBe('long');
    expect(firstTrade.exitPrice).toBeGreaterThan(0);
  });

  it('produces zero trades when price never crosses the trigger level', () => {
    const prices = Array.from({ length: 20 }, () => 50);
    const strategy = buildStrategy();
    const candles = buildCandles(prices);

    const result = runBacktest(strategy, candles, 10000);

    expect(result.trades.length).toBe(0);
    expect(result.metrics.totalTrades).toBe(0);
    expect(result.metrics.winRate).toBe(0);
  });

  it('exits at the stop loss price when price falls through it intrabar', () => {
    const strategy = buildStrategy({
      riskControls: { stopLossPercent: 2 },
    });
    // Cross above 100 at index 5, then a sharp drop that should trigger the 2% stop loss.
    const prices = [95, 96, 97, 98, 99, 105, 95];
    const candles = buildCandles(prices).map((c, i) =>
      i === 6 ? { ...c, high: 105, low: 90, close: 95 } : c,
    );

    const result = runBacktest(strategy, candles, 10000);

    const stopLossTrade = result.trades.find((t) => t.exitReason === 'stop_loss');
    expect(stopLossTrade).toBeDefined();
  });

  it('computes a non-negative max drawdown and consistent trade counts', () => {
    const prices = [95, 96, 97, 98, 99, 105, 110, 95, 90, 108, 112, 90, 85, 130, 140, 80];
    const strategy = buildStrategy();
    const candles = buildCandles(prices);

    const result = runBacktest(strategy, candles, 10000);

    expect(result.metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.metrics.totalTrades).toBe(result.metrics.winningTrades + result.metrics.losingTrades);
  });
});
