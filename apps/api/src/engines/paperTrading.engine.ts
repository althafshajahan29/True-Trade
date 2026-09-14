import {
  Alert,
  Bot,
  BotLogEntry,
  BotLogLevel,
  BotSignal,
  DEFAULT_RISK_SETTINGS,
  generateId,
  Position,
  PositionDirection,
  RiskSettings,
  round,
  SignalType,
  Strategy,
  Trade,
} from '@right-trade/shared';
import { alertRepo } from '../repositories/alert.repo';
import { botRepo } from '../repositories/bot.repo';
import { portfolioSnapshotRepo } from '../repositories/portfolioSnapshot.repo';
import { positionRepo } from '../repositories/position.repo';
import { riskSettingsRepo } from '../repositories/riskSettings.repo';
import { strategyRepo } from '../repositories/strategy.repo';
import { tradeRepo } from '../repositories/trade.repo';
import { userRepo } from '../repositories/user.repo';
import { computeQuantity, withinSchedule } from './backtest.engine';
import { marketDataService, timeframeMs } from '../services/marketData.service';
import { evaluateAnyRule, IndicatorEngine } from './ruleEngine';

const LOOKBACK_CANDLES = 250;
const MIN_WARMUP_CANDLES = 30;

function recordSignal(bot: Bot, type: SignalType, reason: string, price: number): void {
  const signal: BotSignal = {
    id: generateId(),
    botId: bot.id,
    type,
    reason,
    price: round(price),
    createdAt: new Date().toISOString(),
  };
  botRepo.addSignal(signal);
  botRepo.touchSignal(bot.id, signal.createdAt);
}

function logBot(botId: string, level: BotLogLevel, message: string): void {
  const log: BotLogEntry = {
    id: generateId(),
    botId,
    level,
    message,
    createdAt: new Date().toISOString(),
  };
  botRepo.addLog(log);
}

function raiseAlert(alert: Omit<Alert, 'id' | 'read' | 'createdAt'>): void {
  alertRepo.create({
    ...alert,
    id: generateId(),
    read: false,
    createdAt: new Date().toISOString(),
  });
}

function hourWithinTradingWindow(startHour: number, endHour: number, hour: number): boolean {
  if (startHour <= endHour) return hour >= startHour && hour <= endHour;
  return hour >= startHour || hour <= endHour;
}

function getRiskSettings(userId: string): RiskSettings {
  return (
    riskSettingsRepo.findByUserId(userId) ?? {
      ...DEFAULT_RISK_SETTINGS,
      userId,
      updatedAt: new Date().toISOString(),
    }
  );
}

function closePosition(bot: Bot, position: Position, exitPrice: number, exitReason: string): void {
  const pnl =
    position.direction === 'long'
      ? (exitPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - exitPrice) * position.quantity;
  const notional = position.entryPrice * position.quantity;
  const pnlPercent = notional === 0 ? 0 : (pnl / notional) * 100;
  const nowIso = new Date().toISOString();

  tradeRepo.close(position.id, round(exitPrice), round(pnl), round(pnlPercent, 4), nowIso, exitReason);
  positionRepo.delete(position.id);
  userRepo.adjustPaperBalance(bot.userId, pnl);

  const readableReason = exitReason.replace('_', ' ');
  recordSignal(
    bot,
    'exit',
    `Closed ${position.direction} ${position.symbol} @ ${round(exitPrice, 2)} (${readableReason})`,
    exitPrice,
  );
  logBot(bot.id, 'info', `Position closed via ${readableReason} — P/L ${pnl >= 0 ? '+' : ''}${round(pnl, 2)}`);

  raiseAlert({
    userId: bot.userId,
    type: 'trade_execution',
    severity: pnl >= 0 ? 'info' : 'warning',
    title: `${bot.name} closed a position`,
    message: `${position.symbol} ${position.direction} closed at ${round(exitPrice, 2)} for ${
      pnl >= 0 ? 'a gain' : 'a loss'
    } of ${pnl >= 0 ? '+' : ''}${round(pnl, 2)}.`,
    relatedBotId: bot.id,
    relatedSymbol: position.symbol,
  });
}

function handleOpenPosition(
  bot: Bot,
  strategy: Strategy,
  position: Position,
  engine: IndicatorEngine,
  index: number,
  price: number,
): void {
  let trailingStopPrice = position.trailingStopPrice;
  const trailPct = strategy.riskControls.trailingStopPercent;
  if (trailPct) {
    if (position.direction === 'long') {
      const candidate = price * (1 - trailPct / 100);
      if (trailingStopPrice === null || candidate > trailingStopPrice) trailingStopPrice = candidate;
    } else {
      const candidate = price * (1 + trailPct / 100);
      if (trailingStopPrice === null || candidate < trailingStopPrice) trailingStopPrice = candidate;
    }
  }

  let exitReason: string | null = null;
  if (position.direction === 'long') {
    if (position.stopLoss !== null && price <= position.stopLoss) exitReason = 'stop_loss';
    else if (trailingStopPrice !== null && price <= trailingStopPrice) exitReason = 'trailing_stop';
    else if (position.takeProfit !== null && price >= position.takeProfit) exitReason = 'take_profit';
  } else {
    if (position.stopLoss !== null && price >= position.stopLoss) exitReason = 'stop_loss';
    else if (trailingStopPrice !== null && price >= trailingStopPrice) exitReason = 'trailing_stop';
    else if (position.takeProfit !== null && price <= position.takeProfit) exitReason = 'take_profit';
  }

  if (!exitReason && evaluateAnyRule(strategy.exitRules, engine, index)) {
    exitReason = 'signal';
  }

  if (exitReason) {
    closePosition(bot, position, price, exitReason);
  } else {
    positionRepo.updatePrice(position.id, round(price), trailingStopPrice ? round(trailingStopPrice) : null);
  }
}

function handleFlat(
  bot: Bot,
  strategy: Strategy,
  riskSettings: RiskSettings,
  engine: IndicatorEngine,
  index: number,
  price: number,
): void {
  if (!evaluateAnyRule(strategy.entryRules, engine, index)) return;
  if (!withinSchedule(strategy.schedule, Date.now())) return;

  const openCount = positionRepo.countOpenByUser(bot.userId);
  if (openCount >= riskSettings.maxOpenPositions) {
    logBot(bot.id, 'warning', 'Skipped entry — maximum open positions reached for your account.');
    return;
  }
  if (riskSettings.allowedSymbols.length > 0 && !riskSettings.allowedSymbols.includes(strategy.symbol)) {
    logBot(bot.id, 'warning', `Skipped entry — ${strategy.symbol} is not in your allowed symbols list.`);
    return;
  }
  const hour = new Date().getUTCHours();
  if (!hourWithinTradingWindow(riskSettings.tradingHoursStartUtc, riskSettings.tradingHoursEndUtc, hour)) {
    return;
  }

  const direction: PositionDirection | null =
    strategy.direction === 'long' || strategy.direction === 'both'
      ? 'long'
      : strategy.direction === 'short'
        ? 'short'
        : null;
  if (!direction) return;

  const quantity = computeQuantity(strategy, bot.allocatedCapital, price);
  if (quantity <= 0) return;

  const entryPrice = price;
  const slPct = strategy.riskControls.stopLossPercent;
  const tpPct = strategy.riskControls.takeProfitPercent;
  const stopLoss =
    slPct != null ? (direction === 'long' ? entryPrice * (1 - slPct / 100) : entryPrice * (1 + slPct / 100)) : null;
  const takeProfit =
    tpPct != null ? (direction === 'long' ? entryPrice * (1 + tpPct / 100) : entryPrice * (1 - tpPct / 100)) : null;

  const id = generateId();
  const nowIso = new Date().toISOString();

  const position: Position = {
    id,
    userId: bot.userId,
    botId: bot.id,
    symbol: strategy.symbol,
    direction,
    quantity,
    entryPrice,
    currentPrice: entryPrice,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    openedAt: nowIso,
    stopLoss: stopLoss ? round(stopLoss) : null,
    takeProfit: takeProfit ? round(takeProfit) : null,
    trailingStopPercent: strategy.riskControls.trailingStopPercent ?? null,
    trailingStopPrice: null,
  };
  positionRepo.create(position);

  const trade: Trade = {
    id,
    userId: bot.userId,
    botId: bot.id,
    positionId: id,
    symbol: strategy.symbol,
    direction,
    quantity,
    entryPrice: round(entryPrice),
    exitPrice: null,
    status: 'open',
    source: 'bot',
    pnl: null,
    pnlPercent: null,
    openedAt: nowIso,
    closedAt: null,
    exitReason: null,
  };
  tradeRepo.create(trade);

  recordSignal(bot, direction === 'long' ? 'entry_long' : 'entry_short', `Opened ${direction} ${strategy.symbol} @ ${round(entryPrice, 2)}`, entryPrice);
  logBot(bot.id, 'info', `Entered ${direction} position: ${round(quantity, 4)} units @ ${round(entryPrice, 2)}`);
  raiseAlert({
    userId: bot.userId,
    type: 'trade_execution',
    severity: 'info',
    title: `${bot.name} opened a position`,
    message: `${strategy.symbol} ${direction} opened at ${round(entryPrice, 2)}.`,
    relatedBotId: bot.id,
    relatedSymbol: strategy.symbol,
  });
}

/** Evaluates one bot against the freshest market data and executes paper trades as needed. */
export function tickBot(bot: Bot): void {
  const strategy = strategyRepo.findById(bot.strategyId);
  if (!strategy) {
    botRepo.updateStatus(bot.id, 'error', 'Linked strategy could not be found.');
    return;
  }

  const tfMs = timeframeMs(strategy.timeframe);
  const alignedNow = Math.floor(Date.now() / tfMs) * tfMs;
  const startMs = alignedNow - LOOKBACK_CANDLES * tfMs;

  let candles;
  try {
    candles = marketDataService.getCandles(strategy.symbol, strategy.timeframe, startMs, alignedNow);
  } catch (err) {
    logBot(bot.id, 'error', `Market data error: ${(err as Error).message}`);
    return;
  }

  if (candles.length < MIN_WARMUP_CANDLES) {
    return;
  }

  const liveQuote = marketDataService.getLiveQuote(strategy.symbol);
  const engine = new IndicatorEngine(candles);
  const lastIndex = candles.length - 1;
  const riskSettings = getRiskSettings(bot.userId);

  const existingPosition = positionRepo.findOpenByBot(bot.id);
  if (existingPosition) {
    handleOpenPosition(bot, strategy, existingPosition, engine, lastIndex, liveQuote.price);
  } else if (!riskSettings.emergencyStopEnabled) {
    handleFlat(bot, strategy, riskSettings, engine, lastIndex, liveQuote.price);
  }
}

function checkDailyLossLimit(userId: string, riskSettings: RiskSettings): void {
  const closedToday = tradeRepo.listClosedToday(userId);
  const realizedToday = closedToday.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
  const balance = userRepo.getPaperBalance(userId);
  if (balance <= 0 || realizedToday >= 0) return;

  const lossPercent = (-realizedToday / balance) * 100;
  if (lossPercent >= riskSettings.maxDailyLossPercent) {
    const running = botRepo.listAllRunning().filter((b) => b.userId === userId);
    if (running.length === 0) return;
    for (const runningBot of running) {
      botRepo.updateStatus(runningBot.id, 'paused', null);
      logBot(runningBot.id, 'warning', 'Auto-paused: daily loss limit reached.');
    }
    raiseAlert({
      userId,
      type: 'risk',
      severity: 'critical',
      title: 'Daily loss limit reached',
      message: `Your account hit its ${riskSettings.maxDailyLossPercent}% daily loss limit. All running bots have been paused.`,
      relatedBotId: null,
      relatedSymbol: null,
    });
  }
}

/** Ticks every currently-running bot across all users. Called on an interval by the server, and can be triggered manually for tests. */
export function tickAllRunningBots(): void {
  const bots = botRepo.listAllRunning();
  const userIds = new Set<string>();

  for (const bot of bots) {
    try {
      tickBot(bot);
      userIds.add(bot.userId);
    } catch (err) {
      botRepo.updateStatus(bot.id, 'error', (err as Error).message);
      logBot(bot.id, 'error', `Unexpected error: ${(err as Error).message}`);
    }
  }

  for (const userId of userIds) {
    checkDailyLossLimit(userId, getRiskSettings(userId));
    snapshotPortfolio(userId);
  }
}

export function snapshotPortfolio(userId: string): void {
  const positions = positionRepo.listByUser(userId);
  const unrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const balance = userRepo.getPaperBalance(userId);
  const closedToday = tradeRepo.listClosedToday(userId);
  const realizedPnl = closedToday.reduce((acc, t) => acc + (t.pnl ?? 0), 0);

  portfolioSnapshotRepo.create({
    id: generateId(),
    userId,
    timestamp: new Date().toISOString(),
    balance: round(balance),
    equity: round(balance + unrealizedPnl),
    unrealizedPnl: round(unrealizedPnl),
    realizedPnl: round(realizedPnl),
  });
}
