import { Alert, generateId, PriceAlertRule } from '@right-trade/shared';
import { alertRepo } from '../repositories/alert.repo';
import { NotFoundError } from '../utils/errors';

export const alertService = {
  list(userId: string): Alert[] {
    return alertRepo.listByUser(userId);
  },

  unreadCount(userId: string): number {
    return alertRepo.countUnread(userId);
  },

  markRead(userId: string, id: string): Alert {
    const alert = alertRepo.listByUser(userId).find((a) => a.id === id);
    if (!alert) throw new NotFoundError('Alert');
    alertRepo.markRead(id);
    return { ...alert, read: true };
  },

  markAllRead(userId: string): void {
    alertRepo.markAllRead(userId);
  },

  createPriceRule(userId: string, symbol: string, condition: 'above' | 'below', targetPrice: number): PriceAlertRule {
    const rule: PriceAlertRule = {
      id: generateId(),
      userId,
      symbol,
      condition,
      targetPrice,
      active: true,
      createdAt: new Date().toISOString(),
    };
    alertRepo.createPriceRule(rule);
    return rule;
  },
};
