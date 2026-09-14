import { BacktestResult, BacktestRun, CreateBacktestRequest, generateId } from '@right-trade/shared';
import { backtestRepo } from '../repositories/backtest.repo';
import { runBacktest } from '../engines/backtest.engine';
import { marketDataService } from '../services/marketData.service';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { strategyService } from './strategy.service';

export const backtestService = {
  run(userId: string, input: CreateBacktestRequest): { run: BacktestRun; result: BacktestResult } {
    const strategy = strategyService.get(userId, input.strategyId);

    const startMs = Date.parse(input.startDate);
    const endMs = Date.parse(input.endDate);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      throw new ValidationError('Choose a valid start and end date, with the end after the start.');
    }

    const run: BacktestRun = {
      id: generateId(),
      strategyId: strategy.id,
      userId,
      symbol: strategy.symbol,
      timeframe: strategy.timeframe,
      startDate: input.startDate,
      endDate: input.endDate,
      initialBalance: input.initialBalance,
      status: 'running',
      createdAt: new Date().toISOString(),
      completedAt: null,
      errorMessage: null,
    };
    backtestRepo.createRun(run);

    try {
      const candles = marketDataService.getCandles(strategy.symbol, strategy.timeframe, startMs, endMs);
      if (candles.length < 30) {
        throw new ValidationError(
          'Not enough historical candles in this range to compute indicators. Choose a longer date range.',
        );
      }

      const { trades, equityCurve, metrics } = runBacktest(strategy, candles, input.initialBalance);
      const tradesWithRunId = trades.map((t) => ({ ...t, backtestRunId: run.id }));
      backtestRepo.saveResult(run.id, metrics, equityCurve, tradesWithRunId);
      backtestRepo.updateRunStatus(run.id, 'completed');

      const completedRun = backtestRepo.findRunById(run.id)!;
      const result: BacktestResult = { backtestRunId: run.id, metrics, equityCurve, trades: tradesWithRunId };
      return { run: completedRun, result };
    } catch (err) {
      backtestRepo.updateRunStatus(run.id, 'failed', (err as Error).message);
      throw err;
    }
  },

  list(userId: string): BacktestRun[] {
    return backtestRepo.listRunsByUser(userId);
  },

  get(userId: string, id: string): { run: BacktestRun; result: BacktestResult | null } {
    const run = backtestRepo.findRunById(id);
    if (!run) throw new NotFoundError('Backtest');
    if (run.userId !== userId) throw new ForbiddenError();
    return { run, result: backtestRepo.findResult(id) };
  },
};
