import { ISODateString, UUID } from './common';

export interface RiskSettings {
  userId: UUID;
  maxDailyLossPercent: number;
  maxOpenPositions: number;
  maxCapitalPerBotPercent: number;
  riskPerTradePercent: number;
  /** Empty array means all symbols are allowed. */
  allowedSymbols: string[];
  tradingHoursStartUtc: number;
  tradingHoursEndUtc: number;
  drawdownLimitPercent: number;
  emergencyStopEnabled: boolean;
  updatedAt: ISODateString;
}

export const DEFAULT_RISK_SETTINGS: Omit<RiskSettings, 'userId' | 'updatedAt'> = {
  maxDailyLossPercent: 5,
  maxOpenPositions: 5,
  maxCapitalPerBotPercent: 20,
  riskPerTradePercent: 1,
  allowedSymbols: [],
  tradingHoursStartUtc: 0,
  tradingHoursEndUtc: 23,
  drawdownLimitPercent: 15,
  emergencyStopEnabled: false,
};
