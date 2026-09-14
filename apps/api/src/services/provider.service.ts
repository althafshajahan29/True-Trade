import { CopySubscription, ProviderProfile } from '@right-trade/shared';
import { providerRepo } from '../repositories/provider.repo';
import { subscriptionRepo } from '../repositories/subscription.repo';
import { userRepo } from '../repositories/user.repo';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { copyTradingService } from './copyTrading.service';

export const providerService = {
  list(): ProviderProfile[] {
    return providerRepo.list();
  },

  get(id: string): ProviderProfile {
    const provider = providerRepo.findById(id);
    if (!provider) throw new NotFoundError('Provider');
    return provider;
  },

  listSubscriptions(userId: string): CopySubscription[] {
    return subscriptionRepo.listByUser(userId);
  },

  subscribe(userId: string, providerId: string, allocation: number): CopySubscription {
    this.get(providerId);
    if (subscriptionRepo.findActiveForProvider(userId, providerId)) {
      throw new ConflictError('You are already copying this provider.');
    }
    const balance = userRepo.getPaperBalance(userId);
    if (allocation > balance) {
      throw new ValidationError('Allocation exceeds your available paper balance.');
    }
    return copyTradingService.subscribe(userId, providerId, allocation);
  },

  unsubscribe(userId: string, subscriptionId: string): void {
    const sub = subscriptionRepo.listByUser(userId).find((s) => s.id === subscriptionId);
    if (!sub) throw new NotFoundError('Subscription');
    copyTradingService.unsubscribe(sub.id, sub.providerId);
  },
};
