import { ProviderProfile } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface ProviderRow {
  id: string;
  user_id: string;
  display_name: string;
  bio: string;
  avatar_color: string;
  assets_traded: string;
  win_rate: number;
  net_profit_percent: number;
  max_drawdown_percent: number;
  risk_score: number;
  followers: number;
  monthly_performance: string;
  equity_curve: string;
  created_at: string;
}

function mapRow(row: ProviderRow): ProviderProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    bio: row.bio,
    avatarColor: row.avatar_color,
    assetsTraded: JSON.parse(row.assets_traded),
    winRate: row.win_rate,
    netProfitPercent: row.net_profit_percent,
    maxDrawdownPercent: row.max_drawdown_percent,
    riskScore: row.risk_score,
    followers: row.followers,
    monthlyPerformance: JSON.parse(row.monthly_performance),
    equityCurve: JSON.parse(row.equity_curve),
    createdAt: row.created_at,
  };
}

export const providerRepo = {
  create(provider: ProviderProfile): void {
    getDb()
      .prepare(
        `INSERT INTO provider_profiles (id, user_id, display_name, bio, avatar_color, assets_traded, win_rate, net_profit_percent, max_drawdown_percent, risk_score, followers, monthly_performance, equity_curve, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        provider.id,
        provider.userId,
        provider.displayName,
        provider.bio,
        provider.avatarColor,
        JSON.stringify(provider.assetsTraded),
        provider.winRate,
        provider.netProfitPercent,
        provider.maxDrawdownPercent,
        provider.riskScore,
        provider.followers,
        JSON.stringify(provider.monthlyPerformance),
        JSON.stringify(provider.equityCurve),
        provider.createdAt,
      );
  },

  findById(id: string): ProviderProfile | null {
    const row = getDb().prepare('SELECT * FROM provider_profiles WHERE id = ?').get(id) as
      | ProviderRow
      | undefined;
    return row ? mapRow(row) : null;
  },

  list(): ProviderProfile[] {
    const rows = getDb()
      .prepare('SELECT * FROM provider_profiles ORDER BY net_profit_percent DESC')
      .all() as ProviderRow[];
    return rows.map(mapRow);
  },

  incrementFollowers(id: string, delta: number): void {
    getDb()
      .prepare('UPDATE provider_profiles SET followers = followers + ? WHERE id = ?')
      .run(delta, id);
  },
};
