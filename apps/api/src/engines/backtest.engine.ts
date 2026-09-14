import {
  average,
  BacktestExitReason,
  BacktestMetrics,
  BacktestTrade,
  Candle,
  EquityPoint,
  generateId,
  PositionDirection,
  round,
  standardDeviation,
  Strategy,
  sum,
  TradingScheduleConfig,
} from '@right-trade/shared';
import { evaluateAnyRule, IndicatorEngine } from './ruleEngine';

interface OpenTrade {
  direction: PositionDirection;
  entryTime: string;
  entryPrice: number;
  quantity: number;
  stopLossPrice: number | null;
  takeProfitPrice: number | null;
  trailingStopPercent: number | null;
  trailingStopPrice: number | null;
}

export interface BacktestRunResult {
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  metrics: BacktestMetrics;
}

export function computeQuantity(strategy: Strategy, equity: number, price: number): number {
  const { method, value } = strategy.positionSizing;
  if (price <= 0 || value <= 0) return 0;
  switch (method) {
    case 'fixed_units':
      return value;
    case 'fixed_notional':
      return value / price;
    case 'percent_of_equity':
      return (equity * (value / 100)) / price;
    default:
      return 0;
  }
}

export function withinSchedule(schedule: TradingScheduleConfig, timestampMs: number): boolean {
  const date = new Date(timestampMs);
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  if (!schedule.daysOfWeek.includes(day)) return false;
  if (schedule.startHourUtc <= schedule.endHourUtc) {
    return hour >= schedule.startHourUtc && hour <= schedule.endHourUtc;
  }
  return hour >= schedule.startHourUtc || hour <= schedule.endHourUtc;
}

function closeTrade(
  open: OpenTrade,
  exitPrice: number,
  exitTimestampMs: number,
  exitReason: BacktestExitReason,
): { trade: BacktestTrade; pnl: number } {
  const pnl =
    open.direction === 'long'
      ? (exitPrice - open.entryPrice) * open.quantity
      : (open.entryPrice - exitPrice) * open.quantity;
  const notional = open.entryPrice * open.quantity;
  const trade: BacktestTrade = {
    id: generateId(),
    backtestRunId: '',
    direction: open.direction,
    entryTime: open.entryTime,
    entryPrice: round(open.entryPrice),
    exitTime: new Date(exitTimestampMs).toISOString(),
    exitPrice: round(exitPrice),
    quantity: round(open.quantity, 6),
    pnl: round(pnl),
    pnlPercent: notional === 0 ? 0 : round((pnl / notional) * 100, 4),
    exitReason,
  };
  return { trade, pnl };
}

export function runBacktest(strategy: Strategy, candles: Candle[], initialBalance: number): BacktestRunResult {
  const engine = new IndicatorEngine(candles);
  const trades: BacktestTrade[] = [];
  const equityCurve: EquityPoint[] = [];

  const allowLong = strategy.direction === 'long' || strategy.direction === 'both';
  const allowShort = strategy.direction === 'short' || strategy.direction === 'both';

  let cash = initialBalance;
  let open: OpenTrade | null = null;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i]!;

    if (open) {
      if (open.trailingStopPercent) {
        if (open.direction === 'long') {
          const candidate = candle.high * (1 - open.trailingStopPercent / 100);
          if (open.trailingStopPrice === null || candidate > open.trailingStopPrice) {
            open.trailingStopPrice = candidate;
          }
        } else {
          const candidate = candle.low * (1 + open.trailingStopPercent / 100);
          if (open.trailingStopPrice === null || candidate < open.trailingStopPrice) {
            open.trailingStopPrice = candidate;
          }
        }
      }

      let exitPrice: number | null = null;
      let exitReason: BacktestExitReason | null = null;

      if (open.direction === 'long') {
        if (open.stopLossPrice !== null && candle.low <= open.stopLossPrice) {
          exitPrice = open.stopLossPrice;
          exitReason = 'stop_loss';
        } else if (open.trailingStopPrice !== null && candle.low <= open.trailingStopPrice) {
          exitPrice = open.trailingStopPrice;
          exitReason = 'trailing_stop';
        } else if (open.takeProfitPrice !== null && candle.high >= open.takeProfitPrice) {
          exitPrice = open.takeProfitPrice;
          exitReason = 'take_profit';
        }
      } else {
        if (open.stopLossPrice !== null && candle.high >= open.stopLossPrice) {
          exitPrice = open.stopLossPrice;
          exitReason = 'stop_loss';
        } else if (open.trailingStopPrice !== null && candle.high >= open.trailingStopPrice) {
          exitPrice = open.trailingStopPrice;
          exitReason = 'trailing_stop';
        } else if (open.takeProfitPrice !== null && candle.low <= open.takeProfitPrice) {
          exitPrice = open.takeProfitPrice;
          exitReason = 'take_profit';
        }
      }

      if (exitPrice === null && evaluateAnyRule(strategy.exitRules, engine, i)) {
        exitPrice = candle.close;
        exitReason = 'signal';
      }

      if (exitPrice !== null && exitReason !== null) {
        const { trade, pnl } = closeTrade(open, exitPrice, candle.timestamp, exitReason);
        trades.push(trade);
        cash += pnl;
        open = null;
      }
    }

    if (!open && evaluateAnyRule(strategy.entryRules, engine, i) && withinSchedule(strategy.schedule, candle.timestamp)) {
      const direction: PositionDirection | null = allowLong ? 'long' : allowShort ? 'short' : null;
      if (direction) {
        const quantity = computeQuantity(strategy, cash, candle.close);
        if (quantity > 0) {
          const entryPrice = candle.close;
          const slPct = strategy.riskControls.stopLossPercent;
          const tpPct = strategy.riskControls.takeProfitPercent;
          const stopLossPrice =
            slPct != null
              ? direction === 'long'
                ? entryPrice * (1 - slPct / 100)
                : entryPrice * (1 + slPct / 100)
              : null;
          const takeProfitPrice =
            tpPct != null
              ? direction === 'long'
                ? entryPrice * (1 + tpPct / 100)
                : entryPrice * (1 - tpPct / 100)
              : null;

          open = {
            direction,
            entryTime: new Date(candle.timestamp).toISOString(),
            entryPrice,
            quantity,
            stopLossPrice,
            takeProfitPrice,
            trailingStopPercent: strategy.riskControls.trailingStopPercent ?? null,
            trailingStopPrice: null,
          };
        }
      }
    }

    const unrealized = open
      ? open.direction === 'long'
        ? (candle.close - open.entryPrice) * open.quantity
        : (open.entryPrice - candle.close) * open.quantity
      : 0;
    equityCurve.push({ timestamp: candle.timestamp, equity: round(cash + unrealized) });
  }

  if (open && candles.length > 0) {
    const lastCandle = candles[candles.length - 1]!;
    const { trade, pnl } = closeTrade(open, lastCandle.close, lastCandle.timestamp, 'end_of_range');
    trades.push(trade);
    cash += pnl;
    if (equityCurve.length > 0) equityCurve[equityCurve.length - 1]!.equity = round(cash);
  }

  return { trades, equityCurve, metrics: computeMetrics(trades, equityCurve, initialBalance) };
}

function computeMetrics(trades: BacktestTrade[], equityCurve: EquityPoint[], initialBalance: number): BacktestMetrics {
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const netProfit = round(sum(trades.map((t) => t.pnl)));
  const grossProfit = sum(wins.map((t) => t.pnl));
  const grossLoss = Math.abs(sum(losses.map((t) => t.pnl)));

  let peak = initialBalance;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    if (point.equity > peak) peak = point.equity;
    const drawdown = peak - point.equity;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1]!.equity;
    if (prev !== 0) returns.push((equityCurve[i]!.equity - prev) / prev);
  }
  const sd = standardDeviation(returns);
  const sharpeRatio = sd === 0 ? 0 : round((average(returns) / sd) * Math.sqrt(252), 2);

  return {
    winRate: trades.length ? round((wins.length / trades.length) * 100, 2) : 0,
    netProfit,
    netProfitPercent: initialBalance ? round((netProfit / initialBalance) * 100, 2) : 0,
    maxDrawdown: round(maxDrawdown),
    maxDrawdownPercent: peak ? round((maxDrawdown / peak) * 100, 2) : 0,
    profitFactor: grossLoss === 0 ? (grossProfit > 0 ? 99.99 : 0) : round(grossProfit / grossLoss, 2),
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    averageTrade: trades.length ? round(netProfit / trades.length) : 0,
    averageWin: wins.length ? round(grossProfit / wins.length) : 0,
    averageLoss: losses.length ? round(-grossLoss / losses.length) : 0,
    sharpeRatio,
  };
}
