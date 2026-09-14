import { Alert, PriceAlertRule } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface AlertRow {
  id: string;
  user_id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  read: number;
  created_at: string;
  related_bot_id: string | null;
  related_symbol: string | null;
}

function mapRow(row: AlertRow): Alert {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as Alert['type'],
    severity: row.severity as Alert['severity'],
    title: row.title,
    message: row.message,
    read: Boolean(row.read),
    createdAt: row.created_at,
    relatedBotId: row.related_bot_id,
    relatedSymbol: row.related_symbol,
  };
}

interface PriceRuleRow {
  id: string;
  user_id: string;
  symbol: string;
  condition: string;
  target_price: number;
  active: number;
  created_at: string;
}

function mapPriceRule(row: PriceRuleRow): PriceAlertRule {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    condition: row.condition as PriceAlertRule['condition'],
    targetPrice: row.target_price,
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

export const alertRepo = {
  create(alert: Alert): void {
    getDb()
      .prepare(
        `INSERT INTO alerts (id, user_id, type, severity, title, message, read, created_at, related_bot_id, related_symbol)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        alert.id,
        alert.userId,
        alert.type,
        alert.severity,
        alert.title,
        alert.message,
        alert.read ? 1 : 0,
        alert.createdAt,
        alert.relatedBotId,
        alert.relatedSymbol,
      );
  },

  listByUser(userId: string, limit = 100): Alert[] {
    const rows = getDb()
      .prepare('SELECT * FROM alerts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
      .all(userId, limit) as AlertRow[];
    return rows.map(mapRow);
  },

  countUnread(userId: string): number {
    const row = getDb()
      .prepare('SELECT COUNT(*) as count FROM alerts WHERE user_id = ? AND read = 0')
      .get(userId) as { count: number };
    return row.count;
  },

  markRead(id: string): void {
    getDb().prepare('UPDATE alerts SET read = 1 WHERE id = ?').run(id);
  },

  markAllRead(userId: string): void {
    getDb().prepare('UPDATE alerts SET read = 1 WHERE user_id = ?').run(userId);
  },

  createPriceRule(rule: PriceAlertRule): void {
    getDb()
      .prepare(
        `INSERT INTO price_alert_rules (id, user_id, symbol, condition, target_price, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(rule.id, rule.userId, rule.symbol, rule.condition, rule.targetPrice, rule.active ? 1 : 0, rule.createdAt);
  },

  listActivePriceRules(): PriceAlertRule[] {
    const rows = getDb().prepare('SELECT * FROM price_alert_rules WHERE active = 1').all() as PriceRuleRow[];
    return rows.map(mapPriceRule);
  },

  deactivatePriceRule(id: string): void {
    getDb().prepare('UPDATE price_alert_rules SET active = 0 WHERE id = ?').run(id);
  },
};
