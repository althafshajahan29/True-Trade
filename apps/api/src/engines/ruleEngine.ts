import { Candle, ComparisonOperator, IndicatorRef, RuleOperand, StrategyCondition, StrategyRule } from '@right-trade/shared';
import { atr, bollinger, ema, macd, rsi, sma } from './indicators';

/**
 * Precomputes and caches indicator series over a candle array so a strategy's
 * rules can be evaluated cheaply at any index during a backtest or a live tick.
 */
export class IndicatorEngine {
  private readonly closes: number[];
  private readonly volumes: number[];
  private readonly cache = new Map<string, number[]>();

  constructor(private readonly candles: Candle[]) {
    this.closes = candles.map((c) => c.close);
    this.volumes = candles.map((c) => c.volume);
  }

  private cacheKey(ref: IndicatorRef): string {
    return `${ref.indicator}_${ref.period ?? 'default'}`;
  }

  private series(ref: IndicatorRef): number[] {
    const key = this.cacheKey(ref);
    const cached = this.cache.get(key);
    if (cached) return cached;

    let result: number[];
    switch (ref.indicator) {
      case 'price':
        result = this.closes;
        break;
      case 'volume':
        result = this.volumes;
        break;
      case 'sma':
        result = sma(this.closes, ref.period ?? 14);
        break;
      case 'ema':
        result = ema(this.closes, ref.period ?? 14);
        break;
      case 'rsi':
        result = rsi(this.closes, ref.period ?? 14);
        break;
      case 'atr':
        result = atr(this.candles, ref.period ?? 14);
        break;
      case 'bollinger_upper':
        result = bollinger(this.closes, ref.period ?? 20).upper;
        break;
      case 'bollinger_lower':
        result = bollinger(this.closes, ref.period ?? 20).lower;
        break;
      case 'macd':
        result = macd(this.closes).macd;
        break;
      case 'macd_signal':
        result = macd(this.closes).signal;
        break;
      default:
        result = new Array(this.closes.length).fill(NaN);
    }
    this.cache.set(key, result);
    return result;
  }

  valueAt(ref: IndicatorRef, index: number): number {
    const s = this.series(ref);
    return index >= 0 && index < s.length ? s[index]! : NaN;
  }
}

function resolveOperand(operand: RuleOperand, engine: IndicatorEngine, index: number): number {
  return operand.kind === 'constant' ? operand.value : engine.valueAt(operand.ref, index);
}

const CROSS_OPERATORS: ComparisonOperator[] = ['crosses_above', 'crosses_below'];

export function evaluateCondition(
  condition: StrategyCondition,
  engine: IndicatorEngine,
  index: number,
): boolean {
  const left = resolveOperand(condition.left, engine, index);
  const right = resolveOperand(condition.right, engine, index);
  if (Number.isNaN(left) || Number.isNaN(right)) return false;

  if (CROSS_OPERATORS.includes(condition.operator)) {
    if (index < 1) return false;
    const prevLeft = resolveOperand(condition.left, engine, index - 1);
    const prevRight = resolveOperand(condition.right, engine, index - 1);
    if (Number.isNaN(prevLeft) || Number.isNaN(prevRight)) return false;
    return condition.operator === 'crosses_above'
      ? prevLeft <= prevRight && left > right
      : prevLeft >= prevRight && left < right;
  }

  switch (condition.operator) {
    case 'greater_than':
      return left > right;
    case 'less_than':
      return left < right;
    case 'equal_to':
      return Math.abs(left - right) < 1e-9;
    default:
      return false;
  }
}

/** A rule fires only when every one of its conditions is true (logical AND). */
export function evaluateRule(rule: StrategyRule, engine: IndicatorEngine, index: number): boolean {
  if (rule.conditions.length === 0) return false;
  return rule.conditions.every((condition) => evaluateCondition(condition, engine, index));
}

export function evaluateAnyRule(rules: StrategyRule[], engine: IndicatorEngine, index: number): StrategyRule | null {
  return rules.find((rule) => evaluateRule(rule, engine, index)) ?? null;
}
