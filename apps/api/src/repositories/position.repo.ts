import { Position } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface PositionRow {
  id: string;
  user_id: string;
  bot_id: string | null;
  symbol: string;
  direction: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  opened_at: string;
  stop_loss: number | null;
  take_profit: number | null;
  trailing_stop_percent: number | null;
  trailing_stop_price: number | null;
}

function mapRow(row: PositionRow): Position {
  const unrealizedPnl =
    row.direction === 'long'
      ? (row.current_price - row.entry_price) * row.quantity
      : (row.entry_price - row.current_price) * row.quantity;
  const notional = row.entry_price * row.quantity;
  return {
    id: row.id,
    userId: row.user_id,
    botId: row.bot_id,
    symbol: row.symbol,
    direction: row.direction as Position['direction'],
    quantity: row.quantity,
    entryPrice: row.entry_price,
    currentPrice: row.current_price,
    unrealizedPnl,
    unrealizedPnlPercent: notional === 0 ? 0 : (unrealizedPnl / notional) * 100,
    openedAt: row.opened_at,
    stopLoss: row.stop_loss,
    takeProfit: row.take_profit,
    trailingStopPercent: row.trailing_stop_percent,
    trailingStopPrice: row.trailing_stop_price,
  };
}

export const positionRepo = {
  create(position: Position): void {
    getDb()
      .prepare(
        `INSERT INTO positions (id, user_id, bot_id, symbol, direction, quantity, entry_price, current_price, opened_at, stop_loss, take_profit, trailing_stop_percent, trailing_stop_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        position.id,
        position.userId,
        position.botId,
        position.symbol,
        position.direction,
        position.quantity,
        position.entryPrice,
        position.currentPrice,
        position.openedAt,
        position.stopLoss,
        position.takeProfit,
        position.trailingStopPercent,
        position.trailingStopPrice,
      );
  },

  findById(id: string): Position | null {
    const row = getDb().prepare('SELECT * FROM positions WHERE id = ?').get(id) as
      | PositionRow
      | undefined;
    return row ? mapRow(row) : null;
  },

  findOpenByBot(botId: string): Position | null {
    const row = getDb().prepare('SELECT * FROM positions WHERE bot_id = ? LIMIT 1').get(botId) as
      | PositionRow
      | undefined;
    return row ? mapRow(row) : null;
  },

  listByUser(userId: string): Position[] {
    const rows = getDb()
      .prepare('SELECT * FROM positions WHERE user_id = ? ORDER BY opened_at DESC')
      .all(userId) as PositionRow[];
    return rows.map(mapRow);
  },

  countOpenByUser(userId: string): number {
    const row = getDb()
      .prepare('SELECT COUNT(*) as count FROM positions WHERE user_id = ?')
      .get(userId) as { count: number };
    return row.count;
  },

  updatePrice(id: string, currentPrice: number, trailingStopPrice: number | null): void {
    getDb()
      .prepare('UPDATE positions SET current_price = ?, trailing_stop_price = ? WHERE id = ?')
      .run(currentPrice, trailingStopPrice, id);
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM positions WHERE id = ?').run(id);
  },
};
