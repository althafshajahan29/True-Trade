import { Position, Trade } from '@right-trade/shared';
import { positionRepo } from '../repositories/position.repo';
import { tradeRepo } from '../repositories/trade.repo';

export const tradeService = {
  listTrades(userId: string): Trade[] {
    return tradeRepo.listByUser(userId);
  },

  listOpenPositions(userId: string): Position[] {
    return positionRepo.listByUser(userId);
  },
};
