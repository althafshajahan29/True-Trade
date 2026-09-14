export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SignUpRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AcceptRiskDisclaimerRequest {
  accepted: boolean;
}

export interface StrategyInput {
  name: string;
  description?: string;
  assetClass: import('./common').AssetClass;
  symbol: string;
  timeframe: import('./common').Timeframe;
  direction: import('./strategy').StrategyDirection;
  entryRules: import('./strategy').StrategyRule[];
  exitRules: import('./strategy').StrategyRule[];
  positionSizing: import('./strategy').PositionSizingConfig;
  riskControls: import('./strategy').RiskControlConfig;
  schedule: import('./strategy').TradingScheduleConfig;
  status?: import('./strategy').StrategyStatus;
}

export interface CreateBacktestRequest {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
}

export interface CreateBotRequest {
  strategyId: string;
  name: string;
  allocatedCapital: number;
  mode?: 'paper' | 'live';
}

export interface CreateCopySubscriptionRequest {
  providerId: string;
  allocation: number;
}
