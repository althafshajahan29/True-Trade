import { UserSettings } from '@right-trade/shared';
import { getDb } from '../db/connection';

interface SettingsRow {
  user_id: string;
  theme: string;
  currency: string;
  push_enabled: number;
  bot_error_alerts: number;
  risk_alerts: number;
  trade_execution_alerts: number;
  price_alerts: number;
}

function mapRow(row: SettingsRow): UserSettings {
  return {
    userId: row.user_id,
    theme: row.theme as UserSettings['theme'],
    currency: row.currency as UserSettings['currency'],
    notifications: {
      userId: row.user_id,
      pushEnabled: Boolean(row.push_enabled),
      botErrorAlerts: Boolean(row.bot_error_alerts),
      riskAlerts: Boolean(row.risk_alerts),
      tradeExecutionAlerts: Boolean(row.trade_execution_alerts),
      priceAlerts: Boolean(row.price_alerts),
    },
  };
}

const DEFAULTS: Omit<UserSettings, 'userId'> = {
  theme: 'dark',
  currency: 'USD',
  notifications: {
    userId: '',
    pushEnabled: true,
    botErrorAlerts: true,
    riskAlerts: true,
    tradeExecutionAlerts: true,
    priceAlerts: true,
  },
};

export const userSettingsRepo = {
  ensureDefaults(userId: string): void {
    getDb()
      .prepare(
        `INSERT OR IGNORE INTO user_settings (user_id, theme, currency, push_enabled, bot_error_alerts, risk_alerts, trade_execution_alerts, price_alerts)
         VALUES (?, 'dark', 'USD', 1, 1, 1, 1, 1)`,
      )
      .run(userId);
  },

  find(userId: string): UserSettings {
    this.ensureDefaults(userId);
    const row = getDb().prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as
      | SettingsRow
      | undefined;
    return row ? mapRow(row) : { userId, ...DEFAULTS, notifications: { ...DEFAULTS.notifications, userId } };
  },

  upsert(settings: UserSettings): void {
    getDb()
      .prepare(
        `INSERT INTO user_settings (user_id, theme, currency, push_enabled, bot_error_alerts, risk_alerts, trade_execution_alerts, price_alerts)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(user_id) DO UPDATE SET
           theme = excluded.theme,
           currency = excluded.currency,
           push_enabled = excluded.push_enabled,
           bot_error_alerts = excluded.bot_error_alerts,
           risk_alerts = excluded.risk_alerts,
           trade_execution_alerts = excluded.trade_execution_alerts,
           price_alerts = excluded.price_alerts`,
      )
      .run(
        settings.userId,
        settings.theme,
        settings.currency,
        settings.notifications.pushEnabled ? 1 : 0,
        settings.notifications.botErrorAlerts ? 1 : 0,
        settings.notifications.riskAlerts ? 1 : 0,
        settings.notifications.tradeExecutionAlerts ? 1 : 0,
        settings.notifications.priceAlerts ? 1 : 0,
      );
  },
};
