import { Currency, ISODateString, UUID } from './common';

export type TradingMode = 'paper' | 'live';

export interface User {
  id: UUID;
  email: string;
  displayName: string;
  passwordHash: string;
  avatarColor: string;
  baseCurrency: Currency;
  tradingMode: TradingMode;
  riskDisclaimerAcceptedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Safe-to-expose subset of User, returned by the API. */
export type UserProfile = Omit<User, 'passwordHash'>;

export interface AuthTokens {
  accessToken: string;
  expiresAt: ISODateString;
}

export interface NotificationPreferences {
  userId: UUID;
  pushEnabled: boolean;
  botErrorAlerts: boolean;
  riskAlerts: boolean;
  tradeExecutionAlerts: boolean;
  priceAlerts: boolean;
}

export type ThemePreference = 'dark' | 'light' | 'system';

export interface UserSettings {
  userId: UUID;
  theme: ThemePreference;
  currency: Currency;
  notifications: NotificationPreferences;
}
