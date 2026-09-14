import { PortfolioSnapshot } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface SnapshotRow {
  id: string;
  user_id: string;
  timestamp: string;
  balance: number;
  equity: number;
  unrealized_pnl: number;
  realized_pnl: number;
}

function mapRow(row: SnapshotRow): PortfolioSnapshot {
  return {
    id: row.id,
    userId: row.user_id,
    timestamp: row.timestamp,
    balance: row.balance,
    equity: row.equity,
    unrealizedPnl: row.unrealized_pnl,
    realizedPnl: row.realized_pnl,
  };
}

export const portfolioSnapshotRepo = {
  create(snapshot: PortfolioSnapshot): void {
    getDb()
      .prepare(
        `INSERT INTO portfolio_snapshots (id, user_id, timestamp, balance, equity, unrealized_pnl, realized_pnl)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        snapshot.id,
        snapshot.userId,
        snapshot.timestamp,
        snapshot.balance,
        snapshot.equity,
        snapshot.unrealizedPnl,
        snapshot.realizedPnl,
      );
  },

  listByUser(userId: string, limit = 200): PortfolioSnapshot[] {
    const rows = getDb()
      .prepare('SELECT * FROM portfolio_snapshots WHERE user_id = ? ORDER BY timestamp ASC LIMIT ?')
      .all(userId, limit) as SnapshotRow[];
    return rows.map(mapRow);
  },
};
