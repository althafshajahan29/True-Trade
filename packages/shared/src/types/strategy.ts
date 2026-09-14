import { AssetClass, ISODateString, PositionDirection, Timeframe, UUID } from './common';

export type IndicatorType =
  | 'price'
  | 'sma'
  | 'ema'
  | 'rsi'
  | 'macd'
  | 'macd_signal'
  | 'bollinger_upper'
  | 'bollinger_lower'
  | 'atr'
  | 'volume';

export interface IndicatorRef {
  indicator: IndicatorType;
  /** Lookback period, required for sma/ema/rsi/atr/bollinger. */
  period?: number;
}

export type RuleOperand =
  | { kind: 'indicator'; ref: IndicatorRef }
  | { kind: 'constant'; value: number };

export type ComparisonOperator =
  | 'crosses_above'
  | 'crosses_below'
  | 'greater_than'
  | 'less_than'
  | 'equal_to';

export interface StrategyCondition {
  id: UUID;
  left: RuleOperand;
  operator: ComparisonOperator;
  right: RuleOperand;
}

export type StrategyRuleType = 'entry' | 'exit';

/** A rule groups conditions that must ALL be true (AND) for it to trigger. */
export interface StrategyRule {
  id: UUID;
  type: StrategyRuleType;
  conditions: StrategyCondition[];
}

export type PositionSizingMethod = 'fixed_units' | 'fixed_notional' | 'percent_of_equity';

export interface PositionSizingConfig {
  method: PositionSizingMethod;
  value: number;
}

export interface RiskControlConfig {
  stopLossPercent?: number;
  takeProfitPercent?: number;
  trailingStopPercent?: number;
}

export interface TradingScheduleConfig {
  /** 0 = Sunday .. 6 = Saturday */
  daysOfWeek: number[];
  startHourUtc: number;
  endHourUtc: number;
}

export type StrategyDirection = PositionDirection | 'both';
export type StrategyStatus = 'draft' | 'active' | 'archived';

export interface Strategy {
  id: UUID;
  userId: UUID;
  name: string;
  description: string;
  assetClass: AssetClass;
  symbol: string;
  timeframe: Timeframe;
  direction: StrategyDirection;
  entryRules: StrategyRule[];
  exitRules: StrategyRule[];
  positionSizing: PositionSizingConfig;
  riskControls: RiskControlConfig;
  schedule: TradingScheduleConfig;
  status: StrategyStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export const DEFAULT_SCHEDULE: TradingScheduleConfig = {
  daysOfWeek: [1, 2, 3, 4, 5],
  startHourUtc: 0,
  endHourUtc: 23,
};
