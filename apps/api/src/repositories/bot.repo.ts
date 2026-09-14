import { Bot, BotLogEntry, BotLogLevel, BotSignal, SignalType } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface BotRow {
  id: string;
  user_id: string;
  strategy_id: string;
  name: string;
  status: string;
  mode: string;
  allocated_capital: number;
  created_at: string;
  updated_at: string;
  last_error_message: string | null;
  last_signal_at: string | null;
}

function mapBot(row: BotRow): Bot {
  return {
    id: row.id,
    userId: row.user_id,
    strategyId: row.strategy_id,
    name: row.name,
    status: row.status as Bot['status'],
    mode: row.mode as Bot['mode'],
    allocatedCapital: row.allocated_capital,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastErrorMessage: row.last_error_message,
    lastSignalAt: row.last_signal_at,
  };
}

interface SignalRow {
  id: string;
  bot_id: string;
  type: string;
  reason: string;
  price: number;
  created_at: string;
}

function mapSignal(row: SignalRow): BotSignal {
  return {
    id: row.id,
    botId: row.bot_id,
    type: row.type as SignalType,
    reason: row.reason,
    price: row.price,
    createdAt: row.created_at,
  };
}

interface LogRow {
  id: string;
  bot_id: string;
  level: string;
  message: string;
  created_at: string;
}

function mapLog(row: LogRow): BotLogEntry {
  return {
    id: row.id,
    botId: row.bot_id,
    level: row.level as BotLogLevel,
    message: row.message,
    createdAt: row.created_at,
  };
}

export const botRepo = {
  create(bot: Bot): void {
    getDb()
      .prepare(
        `INSERT INTO bots (id, user_id, strategy_id, name, status, mode, allocated_capital, created_at, updated_at, last_error_message, last_signal_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        bot.id,
        bot.userId,
        bot.strategyId,
        bot.name,
        bot.status,
        bot.mode,
        bot.allocatedCapital,
        bot.createdAt,
        bot.updatedAt,
        bot.lastErrorMessage,
        bot.lastSignalAt,
      );
  },

  findById(id: string): Bot | null {
    const row = getDb().prepare('SELECT * FROM bots WHERE id = ?').get(id) as BotRow | undefined;
    return row ? mapBot(row) : null;
  },

  listByUser(userId: string): Bot[] {
    const rows = getDb()
      .prepare('SELECT * FROM bots WHERE user_id = ? ORDER BY updated_at DESC')
      .all(userId) as BotRow[];
    return rows.map(mapBot);
  },

  listAllRunning(): Bot[] {
    const rows = getDb().prepare("SELECT * FROM bots WHERE status = 'running'").all() as BotRow[];
    return rows.map(mapBot);
  },

  updateStatus(id: string, status: Bot['status'], errorMessage: string | null = null): void {
    getDb()
      .prepare('UPDATE bots SET status = ?, last_error_message = ?, updated_at = ? WHERE id = ?')
      .run(status, errorMessage, new Date().toISOString(), id);
  },

  touchSignal(id: string, at: string): void {
    getDb().prepare('UPDATE bots SET last_signal_at = ?, updated_at = ? WHERE id = ?').run(at, at, id);
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM bots WHERE id = ?').run(id);
  },

  addSignal(signal: BotSignal): void {
    getDb()
      .prepare(
        'INSERT INTO bot_signals (id, bot_id, type, reason, price, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(signal.id, signal.botId, signal.type, signal.reason, signal.price, signal.createdAt);
  },

  listSignals(botId: string, limit = 20): BotSignal[] {
    const rows = getDb()
      .prepare('SELECT * FROM bot_signals WHERE bot_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(botId, limit) as SignalRow[];
    return rows.map(mapSignal);
  },

  addLog(log: BotLogEntry): void {
    getDb()
      .prepare('INSERT INTO bot_logs (id, bot_id, level, message, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(log.id, log.botId, log.level, log.message, log.createdAt);
  },

  listLogs(botId: string, limit = 50): BotLogEntry[] {
    const rows = getDb()
      .prepare('SELECT * FROM bot_logs WHERE bot_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(botId, limit) as LogRow[];
    return rows.map(mapLog);
  },
};
