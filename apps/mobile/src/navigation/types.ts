export type AuthStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
  RiskDisclaimer: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
  BotDetail: { botId: string };
  TradeHistory: undefined;
  Alerts: undefined;
};

export type StrategiesStackParamList = {
  StrategyList: undefined;
  StrategyBuilder: { strategyId?: string };
  BacktestLab: { strategyId: string };
  BacktestResult: { backtestId: string };
};

export type BotsStackParamList = {
  BotMonitor: undefined;
  BotDetail: { botId: string };
};

export type MarketplaceStackParamList = {
  Marketplace: undefined;
  ProviderProfile: { providerId: string };
};

export type MoreStackParamList = {
  More: undefined;
  Analytics: undefined;
  Alerts: undefined;
  RiskSettings: undefined;
  Settings: undefined;
  TradeHistory: undefined;
  Signals: undefined;
  SignalDetail: { symbol: string };
};

export type MainTabParamList = {
  DashboardTab: undefined;
  StrategiesTab: undefined;
  BotsTab: undefined;
  MarketplaceTab: undefined;
  MoreTab: undefined;
};
