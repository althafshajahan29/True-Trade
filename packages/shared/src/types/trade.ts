import { ISODateString, PositionDirection, UUID } from './common';

export type TradeSource = 'bot' | 'manual' | 'copy';
export type TradeStatus = 'open' | 'closed';

export interface Position {
  id: UUID;
  userId: UUID;
  botId: UUID | null;
  symbol: string;
  direction: PositionDirection;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  openedAt: ISODateString;
  stopLoss: number | null;
  takeProfit: number | null;
  trailingStopPercent: number | null;
  trailingStopPrice: number | null;
}

export interface Trade {
  id: UUID;
  userId: UUID;
  botId: UUID | null;
  positionId: UUID | null;
  symbol: string;
  direction: PositionDirection;
  quantity: number;
  entryPrice: number;
  exitPrice: number | null;
  status: TradeStatus;
  source: TradeSource;
  pnl: number | null;
  pnlPercent: number | null;
  openedAt: ISODateString;
  closedAt: ISODateString | null;
  exitReason: string | null;
}
