/* eslint-disable no-console */
import bcrypt from 'bcryptjs';
import {
  Alert,
  Bot,
  DEFAULT_RISK_SETTINGS,
  EquityPoint,
  generateId,
  MonthlyReturn,
  PortfolioSnapshot,
  ProviderProfile,
  round,
  Strategy,
  Trade,
  User,
} from '@right-trade/shared';
import { getDb } from './connection';
import { userRepo } from '../repositories/user.repo';
import { riskSettingsRepo } from '../repositories/riskSettings.repo';
import { userSettingsRepo } from '../repositories/userSettings.repo';
import { strategyRepo } from '../repositories/strategy.repo';
import { botRepo } from '../repositories/bot.repo';
import { tradeRepo } from '../repositories/trade.repo';
import { providerRepo } from '../repositories/provider.repo';
import { alertRepo } from '../repositories/alert.repo';
import { portfolioSnapshotRepo } from '../repositories/portfolioSnapshot.repo';

const DEMO_EMAIL = 'demo@righttrade.app';
const DEMO_PASSWORD = 'Demo1234!';

function daysAgoIso(days: number, hours = 0): string {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();
}

function buildEquityCurve(startEquity: number, points: number, driftPercent: number, seed: number): EquityPoint[] {
  const curve: EquityPoint[] = [];
  let equity = startEquity;
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(i * 1.7 + seed) * 0.01 + (Math.sin(i * 3.1 + seed * 2) * 0.005);
    equity = equity * (1 + driftPercent / 100 / points + noise);
    curve.push({ timestamp: Date.now() - (points - i) * 86_400_000, equity: round(equity) });
  }
  return curve;
}

function buildMonthlyReturns(months: number, base: number, seed: number): MonthlyReturn[] {
  const now = new Date();
  const result: MonthlyReturn[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const month = d.toISOString().slice(0, 7);
    const returnPercent = round(base + Math.sin(i * 1.3 + seed) * (base / 1.5 + 1.5), 2);
    result.push({ month, returnPercent });
  }
  return result;
}

async function seed(): Promise<void> {
  const db = getDb();
  const existing = userRepo.findByEmail(DEMO_EMAIL);
  if (existing) {
    console.log('Seed data already present — skipping.');
    return;
  }

  console.log('Seeding Right Trade demo data...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const now = new Date().toISOString();
  const user: User = {
    id: generateId(),
    email: DEMO_EMAIL,
    passwordHash,
    displayName: 'Alex Morgan',
    avatarColor: '#5B8DEF',
    baseCurrency: 'USD',
    tradingMode: 'paper',
    riskDisclaimerAcceptedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  userRepo.create(user);
  userRepo.adjustPaperBalance(user.id, 15000); // bring demo balance to 25,000
  riskSettingsRepo.upsert({ ...DEFAULT_RISK_SETTINGS, userId: user.id, updatedAt: now });
  userSettingsRepo.ensureDefaults(user.id);

  // --- Strategies -----------------------------------------------------
  const momentumStrategy: Strategy = {
    id: generateId(),
    userId: user.id,
    name: 'BTC Momentum Cross',
    description: 'Rides momentum when fast EMA crosses above slow EMA, with an RSI confirmation filter.',
    assetClass: 'crypto',
    symbol: 'BTC/USD',
    timeframe: '1h',
    direction: 'long',
    entryRules: [
      {
        id: generateId(),
        type: 'entry',
        conditions: [
          {
            id: generateId(),
            left: { kind: 'indicator', ref: { indicator: 'ema', period: 12 } },
            operator: 'crosses_above',
            right: { kind: 'indicator', ref: { indicator: 'ema', period: 26 } },
          },
          {
            id: generateId(),
            left: { kind: 'indicator', ref: { indicator: 'rsi', period: 14 } },
            operator: 'greater_than',
            right: { kind: 'constant', value: 45 },
          },
        ],
      },
    ],
    exitRules: [
      {
        id: generateId(),
        type: 'exit',
        conditions: [
          {
            id: generateId(),
            left: { kind: 'indicator', ref: { indicator: 'ema', period: 12 } },
            operator: 'crosses_below',
            right: { kind: 'indicator', ref: { indicator: 'ema', period: 26 } },
          },
        ],
      },
    ],
    positionSizing: { method: 'percent_of_equity', value: 15 },
    riskControls: { stopLossPercent: 4, takeProfitPercent: 10, trailingStopPercent: 3 },
    schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6], startHourUtc: 0, endHourUtc: 23 },
    status: 'active',
    createdAt: daysAgoIso(21),
    updatedAt: daysAgoIso(1),
  };
  strategyRepo.create(momentumStrategy);

  const trendStrategy: Strategy = {
    id: generateId(),
    userId: user.id,
    name: 'EUR/USD Trend Rider',
    description: 'Trades with the trend using a 50-period SMA filter on the 4h chart.',
    assetClass: 'forex',
    symbol: 'EUR/USD',
    timeframe: '4h',
    direction: 'both',
    entryRules: [
      {
        id: generateId(),
        type: 'entry',
        conditions: [
          {
            id: generateId(),
            left: { kind: 'indicator', ref: { indicator: 'price' } },
            operator: 'crosses_above',
            right: { kind: 'indicator', ref: { indicator: 'sma', period: 50 } },
          },
        ],
      },
    ],
    exitRules: [
      {
        id: generateId(),
        type: 'exit',
        conditions: [
          {
            id: generateId(),
            left: { kind: 'indicator', ref: { indicator: 'price' } },
            operator: 'crosses_below',
            right: { kind: 'indicator', ref: { indicator: 'sma', period: 50 } },
          },
        ],
      },
    ],
    positionSizing: { method: 'fixed_notional', value: 1000 },
    riskControls: { stopLossPercent: 2, takeProfitPercent: 5 },
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startHourUtc: 6, endHourUtc: 20 },
    status: 'active',
    createdAt: daysAgoIso(14),
    updatedAt: daysAgoIso(2),
  };
  strategyRepo.create(trendStrategy);

  const meanReversionStrategy: Strategy = {
    id: generateId(),
    userId: user.id,
    name: 'AAPL Bollinger Fade',
    description: 'Fades price extremes against Bollinger Band edges on the daily chart.',
    assetClass: 'stocks',
    symbol: 'AAPL',
    timeframe: '1d',
    direction: 'long',
    entryRules: [
      {
        id: generateId(),
        type: 'entry',
        conditions: [
          {
            id: generateId(),
            left: { kind: 'indicator', ref: { indicator: 'price' } },
            operator: 'less_than',
            right: { kind: 'indicator', ref: { indicator: 'bollinger_lower', period: 20 } },
          },
        ],
      },
    ],
    exitRules: [
      {
        id: generateId(),
        type: 'exit',
        conditions: [
          {
            id: generateId(),
            left: { kind: 'indicator', ref: { indicator: 'price' } },
            operator: 'greater_than',
            right: { kind: 'indicator', ref: { indicator: 'sma', period: 20 } },
          },
        ],
      },
    ],
    positionSizing: { method: 'percent_of_equity', value: 10 },
    riskControls: { stopLossPercent: 5 },
    schedule: { daysOfWeek: [1, 2, 3, 4, 5], startHourUtc: 13, endHourUtc: 21 },
    status: 'draft',
    createdAt: daysAgoIso(5),
    updatedAt: daysAgoIso(5),
  };
  strategyRepo.create(meanReversionStrategy);

  // --- Bots -------------------------------------------------------------
  const runningBot: Bot = {
    id: generateId(),
    userId: user.id,
    strategyId: momentumStrategy.id,
    name: 'BTC Momentum Bot',
    status: 'running',
    mode: 'paper',
    allocatedCapital: 4000,
    createdAt: daysAgoIso(18),
    updatedAt: daysAgoIso(0, 1),
    lastErrorMessage: null,
    lastSignalAt: daysAgoIso(0, 3),
  };
  botRepo.create(runningBot);
  botRepo.addLog({ id: generateId(), botId: runningBot.id, level: 'info', message: 'Bot created.', createdAt: daysAgoIso(18) });
  botRepo.addLog({ id: generateId(), botId: runningBot.id, level: 'info', message: 'Bot started.', createdAt: daysAgoIso(17) });

  const pausedBot: Bot = {
    id: generateId(),
    userId: user.id,
    strategyId: trendStrategy.id,
    name: 'EUR Trend Bot',
    status: 'paused',
    mode: 'paper',
    allocatedCapital: 2500,
    createdAt: daysAgoIso(10),
    updatedAt: daysAgoIso(1),
    lastErrorMessage: null,
    lastSignalAt: daysAgoIso(1, 4),
  };
  botRepo.create(pausedBot);
  botRepo.addLog({ id: generateId(), botId: pausedBot.id, level: 'info', message: 'Bot created.', createdAt: daysAgoIso(10) });
  botRepo.addLog({ id: generateId(), botId: pausedBot.id, level: 'warning', message: 'Auto-paused: daily loss limit reached.', createdAt: daysAgoIso(1) });

  // --- Trade history (closed) -------------------------------------------
  const demoTrades: { botId: string; symbol: string; direction: 'long' | 'short'; entry: number; exit: number; qty: number; daysAgo: number }[] = [
    { botId: runningBot.id, symbol: 'BTC/USD', direction: 'long', entry: 60250, exit: 61800, qty: 0.04, daysAgo: 6 },
    { botId: runningBot.id, symbol: 'BTC/USD', direction: 'long', entry: 61200, exit: 60100, qty: 0.05, daysAgo: 5 },
    { botId: runningBot.id, symbol: 'BTC/USD', direction: 'long', entry: 59800, exit: 62400, qty: 0.06, daysAgo: 4 },
    { botId: runningBot.id, symbol: 'BTC/USD', direction: 'long', entry: 62500, exit: 61950, qty: 0.05, daysAgo: 3 },
    { botId: pausedBot.id, symbol: 'EUR/USD', direction: 'long', entry: 1.079, exit: 1.086, qty: 900, daysAgo: 7 },
    { botId: pausedBot.id, symbol: 'EUR/USD', direction: 'short', entry: 1.084, exit: 1.09, qty: 850, daysAgo: 2 },
    { botId: runningBot.id, symbol: 'BTC/USD', direction: 'long', entry: 62100, exit: 63500, qty: 0.05, daysAgo: 1 },
  ];

  let realizedTotal = 0;
  for (const t of demoTrades) {
    const pnl = t.direction === 'long' ? (t.exit - t.entry) * t.qty : (t.entry - t.exit) * t.qty;
    const notional = t.entry * t.qty;
    realizedTotal += pnl;
    const openedAt = daysAgoIso(t.daysAgo, 6);
    const closedAt = daysAgoIso(t.daysAgo, 1);
    const trade: Trade = {
      id: generateId(),
      userId: user.id,
      botId: t.botId,
      positionId: null,
      symbol: t.symbol,
      direction: t.direction,
      quantity: t.qty,
      entryPrice: t.entry,
      exitPrice: t.exit,
      status: 'closed',
      source: 'bot',
      pnl: round(pnl),
      pnlPercent: round((pnl / notional) * 100, 2),
      openedAt,
      closedAt,
      exitReason: pnl >= 0 ? 'take_profit' : 'stop_loss',
    };
    tradeRepo.create(trade);

    botRepo.addSignal({
      id: generateId(),
      botId: t.botId,
      type: t.direction === 'long' ? 'entry_long' : 'entry_short',
      reason: `Entry rule triggered for ${t.symbol}`,
      price: t.entry,
      createdAt: openedAt,
    });
    botRepo.addSignal({
      id: generateId(),
      botId: t.botId,
      type: 'exit',
      reason: `Closed ${t.direction} ${t.symbol} @ ${t.exit} (${trade.exitReason})`,
      price: t.exit,
      createdAt: closedAt,
    });
    botRepo.touchSignal(t.botId, closedAt);
  }
  userRepo.adjustPaperBalance(user.id, realizedTotal);

  // --- Portfolio snapshots (equity curve for the dashboard) --------------
  let equity = 25000 - realizedTotal;
  for (let i = 14; i >= 0; i--) {
    const noise = Math.sin(i * 1.1) * 60;
    equity += (realizedTotal / 14) + noise * 0.2;
    const snapshot: PortfolioSnapshot = {
      id: generateId(),
      userId: user.id,
      timestamp: daysAgoIso(i),
      balance: round(equity),
      equity: round(equity),
      unrealizedPnl: 0,
      realizedPnl: round(realizedTotal),
    };
    portfolioSnapshotRepo.create(snapshot);
  }

  // --- Providers (marketplace) --------------------------------------------
  const providers: Omit<ProviderProfile, 'id' | 'createdAt'>[] = [
    {
      userId: generateId(),
      displayName: 'Quantum Horizon',
      bio: 'Systematic crypto momentum strategies with strict risk controls. Trading since 2019.',
      avatarColor: '#22C55E',
      assetsTraded: ['crypto'],
      winRate: 64,
      netProfitPercent: 182,
      maxDrawdownPercent: 18,
      riskScore: 6,
      followers: 3420,
      monthlyPerformance: buildMonthlyReturns(12, 6, 1),
      equityCurve: buildEquityCurve(10000, 90, 182, 1),
    },
    {
      userId: generateId(),
      displayName: 'Northbridge FX',
      bio: 'Discretionary swing trader focused on major FX pairs and macro trends.',
      avatarColor: '#5B8DEF',
      assetsTraded: ['forex'],
      winRate: 58,
      netProfitPercent: 76,
      maxDrawdownPercent: 9,
      riskScore: 3,
      followers: 1890,
      monthlyPerformance: buildMonthlyReturns(12, 3, 2),
      equityCurve: buildEquityCurve(10000, 90, 76, 2),
    },
    {
      userId: generateId(),
      displayName: 'Steady Equity Partners',
      bio: 'Low-volatility long-only equity strategy targeting consistent monthly gains.',
      avatarColor: '#F59E0B',
      assetsTraded: ['stocks', 'indices'],
      winRate: 71,
      netProfitPercent: 41,
      maxDrawdownPercent: 6,
      riskScore: 2,
      followers: 5210,
      monthlyPerformance: buildMonthlyReturns(12, 2, 3),
      equityCurve: buildEquityCurve(10000, 90, 41, 3),
    },
    {
      userId: generateId(),
      displayName: 'Volatility Edge',
      bio: 'High-conviction, high-risk crypto and commodities scalper. Not for the faint of heart.',
      avatarColor: '#EF4444',
      assetsTraded: ['crypto', 'commodities'],
      winRate: 49,
      netProfitPercent: 265,
      maxDrawdownPercent: 38,
      riskScore: 9,
      followers: 980,
      monthlyPerformance: buildMonthlyReturns(12, 9, 4),
      equityCurve: buildEquityCurve(10000, 90, 265, 4),
    },
    {
      userId: generateId(),
      displayName: 'Meridian Multi-Asset',
      bio: 'Diversified multi-asset trend-following across crypto, FX, and indices.',
      avatarColor: '#A855F7',
      assetsTraded: ['crypto', 'forex', 'indices'],
      winRate: 55,
      netProfitPercent: 98,
      maxDrawdownPercent: 14,
      riskScore: 5,
      followers: 2650,
      monthlyPerformance: buildMonthlyReturns(12, 4, 5),
      equityCurve: buildEquityCurve(10000, 90, 98, 5),
    },
  ];

  for (const p of providers) {
    const profile: ProviderProfile = { ...p, id: generateId(), createdAt: daysAgoIso(200) };
    providerRepo.create(profile);
  }

  // --- Alerts ------------------------------------------------------------
  const alerts: Omit<Alert, 'id'>[] = [
    {
      userId: user.id,
      type: 'trade_execution',
      severity: 'info',
      title: 'BTC Momentum Bot opened a position',
      message: 'BTC/USD long opened at 62,100.00.',
      read: false,
      createdAt: daysAgoIso(1),
      relatedBotId: runningBot.id,
      relatedSymbol: 'BTC/USD',
    },
    {
      userId: user.id,
      type: 'risk',
      severity: 'warning',
      title: 'Daily loss limit reached',
      message: 'Your account hit its 5% daily loss limit. EUR Trend Bot has been paused.',
      read: false,
      createdAt: daysAgoIso(1),
      relatedBotId: pausedBot.id,
      relatedSymbol: null,
    },
    {
      userId: user.id,
      type: 'price',
      severity: 'info',
      title: 'Price alert: BTC/USD',
      message: 'BTC/USD crossed above your target of $62,000.',
      read: true,
      createdAt: daysAgoIso(3),
      relatedBotId: null,
      relatedSymbol: 'BTC/USD',
    },
    {
      userId: user.id,
      type: 'bot_error',
      severity: 'critical',
      title: 'AAPL Bollinger Fade needs attention',
      message: 'Strategy is in draft status and has no active bot yet.',
      read: true,
      createdAt: daysAgoIso(5),
      relatedBotId: null,
      relatedSymbol: 'AAPL',
    },
  ];
  for (const a of alerts) {
    alertRepo.create({ ...a, id: generateId() });
  }

  console.log('Seed complete.');
  console.log(`Demo login — email: ${DEMO_EMAIL}  password: ${DEMO_PASSWORD}`);
  db.exec('PRAGMA optimize;');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exitCode = 1;
  });
