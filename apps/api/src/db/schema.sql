-- Right Trade — SQLite schema (MVP)
-- JSON-shaped columns (marked "json") store JSON.stringify'd payloads and are
-- parsed/serialized at the repository boundary.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_color TEXT NOT NULL,
  base_currency TEXT NOT NULL DEFAULT 'USD',
  trading_mode TEXT NOT NULL DEFAULT 'paper',
  paper_balance REAL NOT NULL DEFAULT 10000,
  risk_disclaimer_accepted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  theme TEXT NOT NULL DEFAULT 'dark',
  currency TEXT NOT NULL DEFAULT 'USD',
  push_enabled INTEGER NOT NULL DEFAULT 1,
  bot_error_alerts INTEGER NOT NULL DEFAULT 1,
  risk_alerts INTEGER NOT NULL DEFAULT 1,
  trade_execution_alerts INTEGER NOT NULL DEFAULT 1,
  price_alerts INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS risk_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  max_daily_loss_percent REAL NOT NULL,
  max_open_positions INTEGER NOT NULL,
  max_capital_per_bot_percent REAL NOT NULL,
  risk_per_trade_percent REAL NOT NULL,
  allowed_symbols TEXT NOT NULL, -- json string[]
  trading_hours_start_utc INTEGER NOT NULL,
  trading_hours_end_utc INTEGER NOT NULL,
  drawdown_limit_percent REAL NOT NULL,
  emergency_stop_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS strategies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  asset_class TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  direction TEXT NOT NULL,
  entry_rules TEXT NOT NULL,    -- json StrategyRule[]
  exit_rules TEXT NOT NULL,     -- json StrategyRule[]
  position_sizing TEXT NOT NULL, -- json
  risk_controls TEXT NOT NULL,   -- json
  schedule TEXT NOT NULL,        -- json
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_strategies_user ON strategies(user_id);

CREATE TABLE IF NOT EXISTS backtest_runs (
  id TEXT PRIMARY KEY,
  strategy_id TEXT NOT NULL REFERENCES strategies(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  initial_balance REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  created_at TEXT NOT NULL,
  completed_at TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_backtests_user ON backtest_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_backtests_strategy ON backtest_runs(strategy_id);

CREATE TABLE IF NOT EXISTS backtest_results (
  backtest_run_id TEXT PRIMARY KEY REFERENCES backtest_runs(id),
  metrics TEXT NOT NULL,       -- json BacktestMetrics
  equity_curve TEXT NOT NULL   -- json EquityPoint[]
);

CREATE TABLE IF NOT EXISTS backtest_trades (
  id TEXT PRIMARY KEY,
  backtest_run_id TEXT NOT NULL REFERENCES backtest_runs(id),
  direction TEXT NOT NULL,
  entry_time TEXT NOT NULL,
  entry_price REAL NOT NULL,
  exit_time TEXT NOT NULL,
  exit_price REAL NOT NULL,
  quantity REAL NOT NULL,
  pnl REAL NOT NULL,
  pnl_percent REAL NOT NULL,
  exit_reason TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_backtest_trades_run ON backtest_trades(backtest_run_id);

CREATE TABLE IF NOT EXISTS bots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  strategy_id TEXT NOT NULL REFERENCES strategies(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'stopped',
  mode TEXT NOT NULL DEFAULT 'paper',
  allocated_capital REAL NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_error_message TEXT,
  last_signal_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bots_user ON bots(user_id);

CREATE TABLE IF NOT EXISTS bot_signals (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL REFERENCES bots(id),
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  price REAL NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bot_signals_bot ON bot_signals(bot_id);

CREATE TABLE IF NOT EXISTS bot_logs (
  id TEXT PRIMARY KEY,
  bot_id TEXT NOT NULL REFERENCES bots(id),
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bot_logs_bot ON bot_logs(bot_id);

CREATE TABLE IF NOT EXISTS positions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  bot_id TEXT REFERENCES bots(id),
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  quantity REAL NOT NULL,
  entry_price REAL NOT NULL,
  current_price REAL NOT NULL,
  opened_at TEXT NOT NULL,
  stop_loss REAL,
  take_profit REAL,
  trailing_stop_percent REAL,
  trailing_stop_price REAL
);

CREATE INDEX IF NOT EXISTS idx_positions_user ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_bot ON positions(bot_id);

CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  bot_id TEXT REFERENCES bots(id),
  position_id TEXT,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,
  quantity REAL NOT NULL,
  entry_price REAL NOT NULL,
  exit_price REAL,
  status TEXT NOT NULL DEFAULT 'open',
  source TEXT NOT NULL DEFAULT 'bot',
  pnl REAL,
  pnl_percent REAL,
  opened_at TEXT NOT NULL,
  closed_at TEXT,
  exit_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_bot ON trades(bot_id);

-- Note: provider_profiles.user_id intentionally has no foreign key — marketplace
-- providers are synthetic/demo trader identities for the MVP, not necessarily
-- backed by a row in `users`.
CREATE TABLE IF NOT EXISTS provider_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  avatar_color TEXT NOT NULL,
  assets_traded TEXT NOT NULL,       -- json AssetClass[]
  win_rate REAL NOT NULL,
  net_profit_percent REAL NOT NULL,
  max_drawdown_percent REAL NOT NULL,
  risk_score REAL NOT NULL,
  followers INTEGER NOT NULL DEFAULT 0,
  monthly_performance TEXT NOT NULL, -- json MonthlyReturn[]
  equity_curve TEXT NOT NULL,        -- json EquityPoint[]
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS copy_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider_id TEXT NOT NULL REFERENCES provider_profiles(id),
  allocation REAL NOT NULL,
  allocation_percent REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_copy_subs_user ON copy_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  related_bot_id TEXT,
  related_symbol TEXT
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);

CREATE TABLE IF NOT EXISTS price_alert_rules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  symbol TEXT NOT NULL,
  condition TEXT NOT NULL,
  target_price REAL NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  timestamp TEXT NOT NULL,
  balance REAL NOT NULL,
  equity REAL NOT NULL,
  unrealized_pnl REAL NOT NULL,
  realized_pnl REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user ON portfolio_snapshots(user_id);

CREATE TABLE IF NOT EXISTS candles (
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  volume REAL NOT NULL,
  PRIMARY KEY (symbol, timeframe, timestamp)
);
