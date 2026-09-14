import {
  Alert,
  AuthTokens,
  BacktestResult,
  BacktestRun,
  Bot,
  BotLogEntry,
  BotSignal,
  Candle,
  CopySubscription,
  CreateBacktestRequest,
  CreateBotRequest,
  CreateCopySubscriptionRequest,
  DashboardOverview,
  Instrument,
  PerformanceMetrics,
  Position,
  PriceAlertRule,
  ProviderProfile,
  Quote,
  RiskSettings,
  SignInRequest,
  SignUpRequest,
  Strategy,
  StrategyInput,
  Timeframe,
  Trade,
  UserProfile,
  UserSettings,
} from '@right-trade/shared';
import { api } from './client';

interface Items<T> {
  items: T[];
}

export const authApi = {
  signUp: (input: SignUpRequest) => api.post<{ user: UserProfile; tokens: AuthTokens }>('/auth/signup', input),
  signIn: (input: SignInRequest) => api.post<{ user: UserProfile; tokens: AuthTokens }>('/auth/signin', input),
};

export const meApi = {
  get: () => api.get<UserProfile & { paperBalance: number }>('/me'),
  update: (input: { displayName?: string; tradingMode?: 'paper' | 'live' }) => api.put<UserProfile>('/me', input),
  acceptRiskDisclaimer: () => api.post<UserProfile>('/me/accept-risk-disclaimer', { accepted: true }),
  getSettings: () => api.get<UserSettings>('/me/settings'),
  updateSettings: (input: UserSettings) => api.put<UserSettings>('/me/settings', input),
};

export const strategiesApi = {
  list: () => api.get<Items<Strategy>>('/strategies').then((r) => r.items),
  get: (id: string) => api.get<Strategy>(`/strategies/${id}`),
  create: (input: StrategyInput) => api.post<Strategy>('/strategies', input),
  update: (id: string, input: StrategyInput) => api.put<Strategy>(`/strategies/${id}`, input),
  remove: (id: string) => api.delete<void>(`/strategies/${id}`),
};

export const backtestsApi = {
  list: () => api.get<Items<BacktestRun>>('/backtests').then((r) => r.items),
  run: (input: CreateBacktestRequest) => api.post<{ run: BacktestRun; result: BacktestResult }>('/backtests', input),
  get: (id: string) => api.get<{ run: BacktestRun; result: BacktestResult | null }>(`/backtests/${id}`),
};

export interface BotDetail {
  bot: Bot;
  positions: Position[];
  trades: Trade[];
  signals: BotSignal[];
  logs: BotLogEntry[];
}

export const botsApi = {
  list: () => api.get<Items<Bot>>('/bots').then((r) => r.items),
  get: (id: string) => api.get<BotDetail>(`/bots/${id}`),
  create: (input: CreateBotRequest) => api.post<Bot>('/bots', input),
  start: (id: string) => api.post<Bot>(`/bots/${id}/start`),
  pause: (id: string) => api.post<Bot>(`/bots/${id}/pause`),
  resume: (id: string) => api.post<Bot>(`/bots/${id}/resume`),
  stop: (id: string) => api.post<Bot>(`/bots/${id}/stop`),
  clone: (id: string) => api.post<Bot>(`/bots/${id}/clone`),
  remove: (id: string) => api.delete<void>(`/bots/${id}`),
};

export const tradesApi = {
  list: () => api.get<Items<Trade>>('/trades').then((r) => r.items),
};

export const positionsApi = {
  list: () => api.get<Items<Position>>('/positions').then((r) => r.items),
};

export const providersApi = {
  list: () => api.get<Items<ProviderProfile>>('/providers').then((r) => r.items),
  get: (id: string) => api.get<ProviderProfile>(`/providers/${id}`),
};

export const subscriptionsApi = {
  list: () => api.get<Items<CopySubscription>>('/copy-subscriptions').then((r) => r.items),
  create: (input: CreateCopySubscriptionRequest) => api.post<CopySubscription>('/copy-subscriptions', input),
  remove: (id: string) => api.delete<void>(`/copy-subscriptions/${id}`),
};

export const riskApi = {
  get: () => api.get<RiskSettings>('/risk-settings'),
  update: (input: Omit<RiskSettings, 'userId' | 'updatedAt'>) => api.put<RiskSettings>('/risk-settings', input),
};

export const alertsApi = {
  list: () => api.get<Items<Alert> & { unreadCount: number }>('/alerts'),
  markRead: (id: string) => api.post<Alert>(`/alerts/${id}/read`),
  markAllRead: () => api.post<void>('/alerts/read-all'),
  createPriceRule: (input: { symbol: string; condition: 'above' | 'below'; targetPrice: number }) =>
    api.post<PriceAlertRule>('/alerts/price-rules', input),
};

export const analyticsApi = {
  overview: () => api.get<DashboardOverview>('/analytics/overview'),
  performance: () => api.get<PerformanceMetrics>('/analytics/performance'),
};

export const marketApi = {
  instruments: () => api.get<Items<Instrument>>('/market/instruments').then((r) => r.items),
  candles: (symbol: string, timeframe: Timeframe, startIso: string, endIso: string) =>
    api
      .get<Items<Candle>>(
        `/market/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&start=${encodeURIComponent(startIso)}&end=${encodeURIComponent(endIso)}`,
      )
      .then((r) => r.items),
  quote: (symbol: string) => api.get<Quote>(`/market/quote?symbol=${encodeURIComponent(symbol)}`),
};
