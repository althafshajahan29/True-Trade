import { CopySubscription } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface SubRow {
  id: string;
  user_id: string;
  provider_id: string;
  allocation: number;
  allocation_percent: number;
  status: string;
  created_at: string;
}

function mapRow(row: SubRow): CopySubscription {
  return {
    id: row.id,
    userId: row.user_id,
    providerId: row.provider_id,
    allocation: row.allocation,
    allocationPercent: row.allocation_percent,
    status: row.status as CopySubscription['status'],
    createdAt: row.created_at,
  };
}

export const subscriptionRepo = {
  create(sub: CopySubscription): void {
    getDb()
      .prepare(
        `INSERT INTO copy_subscriptions (id, user_id, provider_id, allocation, allocation_percent, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(sub.id, sub.userId, sub.providerId, sub.allocation, sub.allocationPercent, sub.status, sub.createdAt);
  },

  listByUser(userId: string): CopySubscription[] {
    const rows = getDb()
      .prepare('SELECT * FROM copy_subscriptions WHERE user_id = ? ORDER BY created_at DESC')
      .all(userId) as SubRow[];
    return rows.map(mapRow);
  },

  findActiveForProvider(userId: string, providerId: string): CopySubscription | null {
    const row = getDb()
      .prepare(
        "SELECT * FROM copy_subscriptions WHERE user_id = ? AND provider_id = ? AND status = 'active' LIMIT 1",
      )
      .get(userId, providerId) as SubRow | undefined;
    return row ? mapRow(row) : null;
  },

  updateStatus(id: string, status: CopySubscription['status']): void {
    getDb().prepare('UPDATE copy_subscriptions SET status = ? WHERE id = ?').run(status, id);
  },
};
