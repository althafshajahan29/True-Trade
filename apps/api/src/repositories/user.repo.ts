import { User } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_color: string;
  base_currency: string;
  trading_mode: string;
  paper_balance: number;
  risk_disclaimer_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    avatarColor: row.avatar_color,
    baseCurrency: row.base_currency as User['baseCurrency'],
    tradingMode: row.trading_mode as User['tradingMode'],
    riskDisclaimerAcceptedAt: row.risk_disclaimer_accepted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const userRepo = {
  create(user: User): void {
    getDb()
      .prepare(
        `INSERT INTO users (id, email, password_hash, display_name, avatar_color, base_currency, trading_mode, paper_balance, risk_disclaimer_accepted_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        user.id,
        user.email.toLowerCase(),
        user.passwordHash,
        user.displayName,
        user.avatarColor,
        user.baseCurrency,
        user.tradingMode,
        10000,
        user.riskDisclaimerAcceptedAt,
        user.createdAt,
        user.updatedAt,
      );
  },

  findByEmail(email: string): User | null {
    const row = getDb()
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase()) as UserRow | undefined;
    return row ? mapRow(row) : null;
  },

  findById(id: string): User | null {
    const row = getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as
      | UserRow
      | undefined;
    return row ? mapRow(row) : null;
  },

  getPaperBalance(userId: string): number {
    const row = getDb().prepare('SELECT paper_balance FROM users WHERE id = ?').get(userId) as
      | { paper_balance: number }
      | undefined;
    return row?.paper_balance ?? 0;
  },

  adjustPaperBalance(userId: string, delta: number): void {
    getDb()
      .prepare('UPDATE users SET paper_balance = paper_balance + ?, updated_at = ? WHERE id = ?')
      .run(delta, new Date().toISOString(), userId);
  },

  acceptRiskDisclaimer(userId: string, acceptedAt: string): void {
    getDb()
      .prepare('UPDATE users SET risk_disclaimer_accepted_at = ?, updated_at = ? WHERE id = ?')
      .run(acceptedAt, acceptedAt, userId);
  },

  updateProfile(userId: string, fields: { displayName?: string; tradingMode?: string }): void {
    const current = this.findById(userId);
    if (!current) return;
    getDb()
      .prepare(
        'UPDATE users SET display_name = ?, trading_mode = ?, updated_at = ? WHERE id = ?',
      )
      .run(
        fields.displayName ?? current.displayName,
        fields.tradingMode ?? current.tradingMode,
        new Date().toISOString(),
        userId,
      );
  },
};
