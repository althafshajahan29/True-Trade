import { Strategy } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface StrategyRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  asset_class: string;
  symbol: string;
  timeframe: string;
  direction: string;
  entry_rules: string;
  exit_rules: string;
  position_sizing: string;
  risk_controls: string;
  schedule: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: StrategyRow): Strategy {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    assetClass: row.asset_class as Strategy['assetClass'],
    symbol: row.symbol,
    timeframe: row.timeframe as Strategy['timeframe'],
    direction: row.direction as Strategy['direction'],
    entryRules: JSON.parse(row.entry_rules),
    exitRules: JSON.parse(row.exit_rules),
    positionSizing: JSON.parse(row.position_sizing),
    riskControls: JSON.parse(row.risk_controls),
    schedule: JSON.parse(row.schedule),
    status: row.status as Strategy['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const strategyRepo = {
  create(strategy: Strategy): void {
    getDb()
      .prepare(
        `INSERT INTO strategies (id, user_id, name, description, asset_class, symbol, timeframe, direction, entry_rules, exit_rules, position_sizing, risk_controls, schedule, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        strategy.id,
        strategy.userId,
        strategy.name,
        strategy.description,
        strategy.assetClass,
        strategy.symbol,
        strategy.timeframe,
        strategy.direction,
        JSON.stringify(strategy.entryRules),
        JSON.stringify(strategy.exitRules),
        JSON.stringify(strategy.positionSizing),
        JSON.stringify(strategy.riskControls),
        JSON.stringify(strategy.schedule),
        strategy.status,
        strategy.createdAt,
        strategy.updatedAt,
      );
  },

  update(strategy: Strategy): void {
    getDb()
      .prepare(
        `UPDATE strategies SET name = ?, description = ?, asset_class = ?, symbol = ?, timeframe = ?, direction = ?, entry_rules = ?, exit_rules = ?, position_sizing = ?, risk_controls = ?, schedule = ?, status = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(
        strategy.name,
        strategy.description,
        strategy.assetClass,
        strategy.symbol,
        strategy.timeframe,
        strategy.direction,
        JSON.stringify(strategy.entryRules),
        JSON.stringify(strategy.exitRules),
        JSON.stringify(strategy.positionSizing),
        JSON.stringify(strategy.riskControls),
        JSON.stringify(strategy.schedule),
        strategy.status,
        strategy.updatedAt,
        strategy.id,
      );
  },

  findById(id: string): Strategy | null {
    const row = getDb().prepare('SELECT * FROM strategies WHERE id = ?').get(id) as
      | StrategyRow
      | undefined;
    return row ? mapRow(row) : null;
  },

  listByUser(userId: string): Strategy[] {
    const rows = getDb()
      .prepare('SELECT * FROM strategies WHERE user_id = ? ORDER BY updated_at DESC')
      .all(userId) as StrategyRow[];
    return rows.map(mapRow);
  },

  delete(id: string): void {
    getDb().prepare('DELETE FROM strategies WHERE id = ?').run(id);
  },
};
