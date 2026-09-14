import { ISODateString, UUID } from './common';

export type AlertType = 'price' | 'bot_error' | 'risk' | 'trade_execution';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface Alert {
  id: UUID;
  userId: UUID;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  read: boolean;
  createdAt: ISODateString;
  relatedBotId: UUID | null;
  relatedSymbol: string | null;
}

export type PriceAlertCondition = 'above' | 'below';

export interface PriceAlertRule {
  id: UUID;
  userId: UUID;
  symbol: string;
  condition: PriceAlertCondition;
  targetPrice: number;
  active: boolean;
  createdAt: ISODateString;
}
