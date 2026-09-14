import { Trade } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface TradeRow {
  id: string;
  user_id: string;
  bot_id: string | null;
  position_id: string | null;
  symbol: string;
  direction: string;
  quantity: number;
  entry_price: number;
  exit_price: number | null;
  status: string;
  source: string;
  pnl: number | null;
  pnl_percent: number | null;
  opened_at: string;
  closed_at: string | null;
  exit_reason: string | null;
}

function mapRow(row: TradeRow): Trade {
  return {
    id: row.id,
    userId: row.user_id,
    botId: row.bot_id,
    positionId: row.position_id,
    symbol: row.symbol,
    direction: row.direction as Trade['direction'],
    quantity: row.quantity,
    entryPrice: row.entry_price,
    exitPrice: row.exit_price,
    status: row.status as Trade['status'],
    source: row.source as Trade['source'],
    pnl: row.pnl,
    pnlPercent: row.pnl_percent,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    exitReason: row.exit_reason,
  };
}

export const tradeRepo = {
  create(trade: Trade): void {
    getDb()
      .prepare(
        `INSERT INTO trades (id, user_id, bot_id, position_id, symbol, direction, quantity, entry_price, exit_price, status, source, pnl, pnl_percent, opened_at, closed_at, exit_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        trade.id,
        trade.userId,
        trade.botId,
        trade.positionId,
        trade.symbol,
        trade.direction,
        trade.quantity,
        trade.entryPrice,
        trade.exitPrice,
        trade.status,
        trade.source,
        trade.pnl,
        trade.pnlPercent,
        trade.openedAt,
        trade.closedAt,
        trade.exitReason,
      );
  },

  close(id: string, exitPrice: number, pnl: number, pnlPercent: number, closedAt: string, exitReason: string): void {
    getDb()
      .prepare(
        `UPDATE trades SET status = 'closed', exit_price = ?, pnl = ?, pnl_percent = ?, closed_at = ?, exit_reason = ? WHERE id = ?`,
      )
      .run(exitPrice, pnl, pnlPercent, closedAt, exitReason, id);
  },

  listByUser(userId: string, limit = 100): Trade[] {
    const rows = getDb()
      .prepare('SELECT * FROM trades WHERE user_id = ? ORDER BY opened_at DESC LIMIT ?')
      .all(userId, limit) as TradeRow[];
    return rows.map(mapRow);
  },

  listByBot(botId: string, limit = 50): Trade[] {
    const rows = getDb()
      .prepare('SELECT * FROM trades WHERE bot_id = ? ORDER BY opened_at DESC LIMIT ?')
      .all(botId, limit) as TradeRow[];
    return rows.map(mapRow);
  },

  listClosedToday(userId: string): Trade[] {
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const rows = getDb()
      .prepare(
        "SELECT * FROM trades WHERE user_id = ? AND status = 'closed' AND closed_at >= ? ORDER BY closed_at DESC",
      )
      .all(userId, startOfDay.toISOString()) as TradeRow[];
    return rows.map(mapRow);
  },

  listAllClosed(userId: string): Trade[] {
    const rows = getDb()
      .prepare("SELECT * FROM trades WHERE user_id = ? AND status = 'closed' ORDER BY closed_at DESC")
      .all(userId) as TradeRow[];
    return rows.map(mapRow);
  },
};
