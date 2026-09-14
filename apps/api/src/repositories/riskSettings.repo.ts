import { RiskSettings } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface RiskRow {
  user_id: string;
  max_daily_loss_percent: number;
  max_open_positions: number;
  max_capital_per_bot_percent: number;
  risk_per_trade_percent: number;
  allowed_symbols: string;
  trading_hours_start_utc: number;
  trading_hours_end_utc: number;
  drawdown_limit_percent: number;
  emergency_stop_enabled: number;
  updated_at: string;
}

function mapRow(row: RiskRow): RiskSettings {
  return {
    userId: row.user_id,
    maxDailyLossPercent: row.max_daily_loss_percent,
    maxOpenPositions: row.max_open_positions,
    maxCapitalPerBotPercent: row.max_capital_per_bot_percent,
    riskPerTradePercent: row.risk_per_trade_percent,
    allowedSymbols: JSON.parse(row.allowed_symbols),
    tradingHoursStartUtc: row.trading_hours_start_utc,
    tradingHoursEndUtc: row.trading_hours_end_utc,
    drawdownLimitPercent: row.drawdown_limit_percent,
    emergencyStopEnabled: Boolean(row.emergency_stop_enabled),
    updatedAt: row.updated_at,
  };
}

export const riskSettingsRepo = {
  upsert(settings: RiskSettings): void {
    getDb()
      .prepare(
        `INSERT INTO risk_settings (user_id, max_daily_loss_percent, max_open_positions, max_capital_per_bot_percent, risk_per_trade_percent, allowed_symbols, trading_hours_start_utc, trading_hours_end_utc, drawdown_limit_percent, emergency_stop_enabled, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           max_daily_loss_percent = excluded.max_daily_loss_percent,
           max_open_positions = excluded.max_open_positions,
           max_capital_per_bot_percent = excluded.max_capital_per_bot_percent,
           risk_per_trade_percent = excluded.risk_per_trade_percent,
           allowed_symbols = excluded.allowed_symbols,
           trading_hours_start_utc = excluded.trading_hours_start_utc,
           trading_hours_end_utc = excluded.trading_hours_end_utc,
           drawdown_limit_percent = excluded.drawdown_limit_percent,
           emergency_stop_enabled = excluded.emergency_stop_enabled,
           updated_at = excluded.updated_at`,
      )
      .run(
        settings.userId,
        settings.maxDailyLossPercent,
        settings.maxOpenPositions,
        settings.maxCapitalPerBotPercent,
        settings.riskPerTradePercent,
        JSON.stringify(settings.allowedSymbols),
        settings.tradingHoursStartUtc,
        settings.tradingHoursEndUtc,
        settings.drawdownLimitPercent,
        settings.emergencyStopEnabled ? 1 : 0,
        settings.updatedAt,
      );
  },

  findByUserId(userId: string): RiskSettings | null {
    const row = getDb().prepare('SELECT * FROM risk_settings WHERE user_id = ?').get(userId) as
      | RiskRow
      | undefined;
    return row ? mapRow(row) : null;
  },
};
