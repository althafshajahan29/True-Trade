import { Candle } from '@right-trade/shared';

export function sma(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  let runningSum = 0;
  for (let i = 0; i < values.length; i++) {
    runningSum += values[i]!;
    if (i >= period) runningSum -= values[i - period]!;
    if (i >= period - 1) result[i] = runningSum / period;
  }
  return result;
}

export function ema(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  const k = 2 / (period + 1);
  let prevEma: number | null = null;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) continue;
    if (prevEma === null) {
      let seedSum = 0;
      for (let j = i - period + 1; j <= i; j++) seedSum += values[j]!;
      prevEma = seedSum / period;
    } else {
      prevEma = values[i]! * k + prevEma * (1 - k);
    }
    result[i] = prevEma;
  }
  return result;
}

function rsiFromValue(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function rsi(values: number[], period: number): number[] {
  const result: number[] = new Array(values.length).fill(NaN);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i < values.length; i++) {
    const change = values[i]! - values[i - 1]!;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    if (i <= period) {
      avgGain += gain;
      avgLoss += loss;
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        result[i] = rsiFromValue(avgGain, avgLoss);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      result[i] = rsiFromValue(avgGain, avgLoss);
    }
  }
  return result;
}

export function atr(candles: Candle[], period: number): number[] {
  const trueRanges = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1]!.close;
    return Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });
  return sma(trueRanges, period);
}

export function bollinger(
  values: number[],
  period: number,
  mult = 2,
): { upper: number[]; lower: number[] } {
  const middle = sma(values, period);
  const upper: number[] = new Array(values.length).fill(NaN);
  const lower: number[] = new Array(values.length).fill(NaN);
  for (let i = 0; i < values.length; i++) {
    const mean = middle[i];
    if (mean === undefined || Number.isNaN(mean)) continue;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) variance += (values[j]! - mean) ** 2;
    variance /= period;
    const sd = Math.sqrt(variance);
    upper[i] = mean + mult * sd;
    lower[i] = mean - mult * sd;
  }
  return { upper, lower };
}

export function macd(values: number[]): { macd: number[]; signal: number[] } {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const macdLine = values.map((_, i) =>
    Number.isNaN(fast[i]) || Number.isNaN(slow[i]) ? NaN : fast[i]! - slow[i]!,
  );
  const firstValid = macdLine.findIndex((v) => !Number.isNaN(v));
  const signal: number[] = new Array(values.length).fill(NaN);
  if (firstValid >= 0) {
    const signalValid = ema(macdLine.slice(firstValid), 9);
    for (let i = 0; i < signalValid.length; i++) signal[firstValid + i] = signalValid[i]!;
  }
  return { macd: macdLine, signal };
}
