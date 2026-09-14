import { ISODateString, UUID } from './common';
import { TradingMode } from './user';

export type BotStatus = 'running' | 'paused' | 'stopped' | 'error';

export interface Bot {
  id: UUID;
  userId: UUID;
  strategyId: UUID;
  name: string;
  status: BotStatus;
  mode: TradingMode;
  allocatedCapital: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  lastErrorMessage: string | null;
  lastSignalAt: ISODateString | null;
}

export type SignalType = 'entry_long' | 'entry_short' | 'exit' | 'no_action';

export interface BotSignal {
  id: UUID;
  botId: UUID;
  type: SignalType;
  reason: string;
  price: number;
  createdAt: ISODateString;
}

export type BotLogLevel = 'info' | 'warning' | 'error';

export interface BotLogEntry {
  id: UUID;
  botId: UUID;
  level: BotLogLevel;
  message: string;
  createdAt: ISODateString;
}
