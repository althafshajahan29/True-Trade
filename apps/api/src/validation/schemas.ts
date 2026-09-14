import { z } from 'zod';

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(60),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const acceptRiskDisclaimerSchema = z.object({
  accepted: z.boolean(),
});

const indicatorRefSchema = z.object({
  indicator: z.enum(['price', 'sma', 'ema', 'rsi', 'macd', 'macd_signal', 'bollinger_upper', 'bollinger_lower', 'atr', 'volume']),
  period: z.number().int().positive().max(500).optional(),
});

const ruleOperandSchema = z.union([
  z.object({ kind: z.literal('indicator'), ref: indicatorRefSchema }),
  z.object({ kind: z.literal('constant'), value: z.number() }),
]);

const strategyConditionSchema = z.object({
  id: z.string(),
  left: ruleOperandSchema,
  operator: z.enum(['crosses_above', 'crosses_below', 'greater_than', 'less_than', 'equal_to']),
  right: ruleOperandSchema,
});

const strategyRuleSchema = z.object({
  id: z.string(),
  type: z.enum(['entry', 'exit']),
  conditions: z.array(strategyConditionSchema).min(1),
});

const positionSizingSchema = z.object({
  method: z.enum(['fixed_units', 'fixed_notional', 'percent_of_equity']),
  value: z.number().positive(),
});

const riskControlsSchema = z.object({
  stopLossPercent: z.number().positive().max(100).optional(),
  takeProfitPercent: z.number().positive().max(1000).optional(),
  trailingStopPercent: z.number().positive().max(100).optional(),
});

const scheduleSchema = z.object({
  daysOfWeek: z.array(z.number().int().min(0).max(6)),
  startHourUtc: z.number().int().min(0).max(23),
  endHourUtc: z.number().int().min(0).max(23),
});

export const strategyInputSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().default(''),
  assetClass: z.enum(['crypto', 'forex', 'stocks', 'indices', 'commodities']),
  symbol: z.string().min(1),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
  direction: z.enum(['long', 'short', 'both']),
  entryRules: z.array(strategyRuleSchema),
  exitRules: z.array(strategyRuleSchema),
  positionSizing: positionSizingSchema,
  riskControls: riskControlsSchema,
  schedule: scheduleSchema,
  status: z.enum(['draft', 'active', 'archived']).optional(),
});

export const createBacktestSchema = z.object({
  strategyId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  initialBalance: z.number().positive().max(10_000_000),
});

export const createBotSchema = z.object({
  strategyId: z.string(),
  name: z.string().min(2).max(80),
  allocatedCapital: z.number().positive().max(10_000_000),
  mode: z.enum(['paper', 'live']).optional(),
});

export const createCopySubscriptionSchema = z.object({
  providerId: z.string(),
  allocation: z.number().positive().max(10_000_000),
});

export const riskSettingsSchema = z.object({
  maxDailyLossPercent: z.number().positive().max(100),
  maxOpenPositions: z.number().int().positive().max(100),
  maxCapitalPerBotPercent: z.number().positive().max(100),
  riskPerTradePercent: z.number().positive().max(100),
  allowedSymbols: z.array(z.string()),
  tradingHoursStartUtc: z.number().int().min(0).max(23),
  tradingHoursEndUtc: z.number().int().min(0).max(23),
  drawdownLimitPercent: z.number().positive().max(100),
  emergencyStopEnabled: z.boolean(),
});

export const createPriceAlertSchema = z.object({
  symbol: z.string().min(1),
  condition: z.enum(['above', 'below']),
  targetPrice: z.number().positive(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  tradingMode: z.enum(['paper', 'live']).optional(),
});
