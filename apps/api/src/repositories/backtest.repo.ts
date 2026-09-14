import { BacktestMetrics, BacktestResult, BacktestRun, BacktestTrade, EquityPoint } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface RunRow {
  id: string;
  strategy_id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_balance: number;
  status: string;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

function mapRun(row: RunRow): BacktestRun {
  return {
    id: row.id,
    strategyId: row.strategy_id,
    userId: row.user_id,
    symbol: row.symbol,
    timeframe: row.timeframe as BacktestRun['timeframe'],
    startDate: row.start_date,
    endDate: row.end_date,
    initialBalance: row.initial_balance,
    status: row.status as BacktestRun['status'],
    createdAt: row.created_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message,
  };
}

interface TradeRow {
  id: string;
  backtest_run_id: string;
  direction: string;
  entry_time: string;
  entry_price: number;
  exit_time: string;
  exit_price: number;
  quantity: number;
  pnl: number;
  pnl_percent: number;
  exit_reason: string;
}

function mapTrade(row: TradeRow): BacktestTrade {
  return {
    id: row.id,
    backtestRunId: row.backtest_run_id,
    direction: row.direction as BacktestTrade['direction'],
    entryTime: row.entry_time,
    entryPrice: row.entry_price,
    exitTime: row.exit_time,
    exitPrice: row.exit_price,
    quantity: row.quantity,
    pnl: row.pnl,
    pnlPercent: row.pnl_percent,
    exitReason: row.exit_reason as BacktestTrade['exitReason'],
  };
}

export const backtestRepo = {
  createRun(run: BacktestRun): void {
    getDb()
      .prepare(
        `INSERT INTO backtest_runs (id, strategy_id, user_id, symbol, timeframe, start_date, end_date, initial_balance, status, created_at, completed_at, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        run.id,
        run.strategyId,
        run.userId,
        run.symbol,
        run.timeframe,
        run.startDate,
        run.endDate,
        run.initialBalance,
        run.status,
        run.createdAt,
        run.completedAt,
        run.errorMessage,
      );
  },

  updateRunStatus(id: string, status: BacktestRun['status'], errorMessage?: string): void {
    getDb()
      .prepare(
        'UPDATE backtest_runs SET status = ?, completed_at = ?, error_message = ? WHERE id = ?',
      )
      .run(
        status,
        status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
        errorMessage ?? null,
        id,
      );
  },

  findRunById(id: string): BacktestRun | null {
    const row = getDb().prepare('SELECT * FROM backtest_runs WHERE id = ?').get(id) as
      | RunRow
      | undefined;
    return row ? mapRun(row) : null;
  },

  listRunsByUser(userId: string): BacktestRun[] {
    const rows = getDb()
      .prepare('SELECT * FROM backtest_runs WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as RunRow[];
    return rows.map(mapRun);
  },

  saveResult(backtestRunId: string, metrics: BacktestMetrics, equityCurve: EquityPoint[], trades: BacktestTrade[]): void {
    const db = getDb();
    db.prepare(
      `INSERT INTO backtest_results (backtest_run_id, metrics, equity_curve)
       VALUES (?, ?, ?)
       ON CONFLICT(backtest_run_id) DO UPDATE SET metrics = excluded.metrics, equity_curve = excluded.equity_curve`,
    ).run(backtestRunId, JSON.stringify(metrics), JSON.stringify(equityCurve));

    const insertTrade = db.prepare(
      `INSERT INTO backtest_trades (id, backtest_run_id, direction, entry_time, entry_price, exit_time, exit_price, quantity, pnl, pnl_percent, exit_reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const trade of trades) {
      insertTrade.run(
        trade.id,
        backtestRunId,
        trade.direction,
        trade.entryTime,
        trade.entryPrice,
        trade.exitTime,
        trade.exitPrice,
        trade.quantity,
        trade.pnl,
        trade.pnlPercent,
        trade.exitReason,
      );
    }
  },

  findResult(backtestRunId: string): BacktestResult | null {
    const resultRow = getDb()
      .prepare('SELECT * FROM backtest_results WHERE backtest_run_id = ?')
      .get(backtestRunId) as { metrics: string; equity_curve: string } | undefined;
    if (!resultRow) return null;

    const tradeRows = getDb()
      .prepare('SELECT * FROM backtest_trades WHERE backtest_run_id = ? ORDER BY entry_time ASC')
      .all(backtestRunId) as TradeRow[];

    return {
      backtestRunId,
      metrics: JSON.parse(resultRow.metrics),
      equityCurve: JSON.parse(resultRow.equity_curve),
      trades: tradeRows.map(mapTrade),
    };
  },
};
