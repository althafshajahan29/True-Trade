import { ISODateString, PositionDirection, Timeframe, UUID } from './common';

export type BacktestStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface BacktestRun {
  id: UUID;
  strategyId: UUID;
  userId: UUID;
  symbol: string;
  timeframe: Timeframe;
  startDate: ISODateString;
  endDate: ISODateString;
  initialBalance: number;
  status: BacktestStatus;
  createdAt: ISODateString;
  completedAt: ISODateString | null;
  errorMessage: string | null;
}

export type BacktestExitReason =
  | 'signal'
  | 'stop_loss'
  | 'take_profit'
  | 'trailing_stop'
  | 'end_of_range';

export interface BacktestTrade {
  id: UUID;
  backtestRunId: UUID;
  direction: PositionDirection;
  entryTime: ISODateString;
  entryPrice: number;
  exitTime: ISODateString;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  exitReason: BacktestExitReason;
}

export interface EquityPoint {
  timestamp: number;
  equity: number;
}

export interface BacktestMetrics {
  winRate: number;
  netProfit: number;
  netProfitPercent: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageTrade: number;
  averageWin: number;
  averageLoss: number;
  sharpeRatio: number;
}

export interface BacktestResult {
  backtestRunId: UUID;
  metrics: BacktestMetrics;
  equityCurve: EquityPoint[];
  trades: BacktestTrade[];
}

/** Placeholder shape for a future parameter-sweep optimizer. */
export interface OptimizationParamRange {
  path: string;
  min: number;
  max: number;
  step: number;
}

export interface OptimizationRequest {
  strategyId: UUID;
  ranges: OptimizationParamRange[];
}
