import { AssetClass, ISODateString, UUID } from './common';
import { EquityPoint } from './backtest';

export interface MonthlyReturn {
  month: string; // YYYY-MM
  returnPercent: number;
}

export interface ProviderProfile {
  id: UUID;
  userId: UUID;
  displayName: string;
  bio: string;
  avatarColor: string;
  assetsTraded: AssetClass[];
  winRate: number;
  netProfitPercent: number;
  maxDrawdownPercent: number;
  riskScore: number; // 1 (low) - 10 (high)
  followers: number;
  monthlyPerformance: MonthlyReturn[];
  equityCurve: EquityPoint[];
  createdAt: ISODateString;
}

export type CopySubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface CopySubscription {
  id: UUID;
  userId: UUID;
  providerId: UUID;
  allocation: number;
  allocationPercent: number;
  status: CopySubscriptionStatus;
  createdAt: ISODateString;
}
