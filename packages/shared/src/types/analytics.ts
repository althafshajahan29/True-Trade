import { ISODateString, UUID } from './common';
import { MonthlyReturn } from './provider';

export interface PortfolioSnapshot {
  id: UUID;
  userId: UUID;
  timestamp: ISODateString;
  balance: number;
  equity: number;
  unrealizedPnl: number;
  realizedPnl: number;
}

export interface BotRanking {
  botId: UUID;
  name: string;
  returnPercent: number;
}

export interface TradeDistributionBucket {
  bucket: string;
  count: number;
}

export interface PerformanceMetrics {
  totalReturnPercent: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  bestBot: BotRanking | null;
  worstBot: BotRanking | null;
  monthlyReturns: MonthlyReturn[];
  tradeDistribution: TradeDistributionBucket[];
}

export interface DashboardOverview {
  balance: number;
  equity: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnlToday: number;
  realizedPnlTodayPercent: number;
  activeBotCount: number;
  totalBotCount: number;
  unreadAlertCount: number;
  equityCurve: { timestamp: number; equity: number }[];
}
