import { generateId, Strategy, StrategyInput } from '@right-trade/shared';
import { strategyRepo } from '../repositories/strategy.repo';
import { botRepo } from '../repositories/bot.repo';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';

function assertOwnership(strategy: Strategy, userId: string): void {
  if (strategy.userId !== userId) throw new ForbiddenError();
}

function validateRules(input: StrategyInput): void {
  if (input.entryRules.length === 0) {
    throw new ValidationError('Add at least one entry rule before saving.');
  }
}

export const strategyService = {
  list(userId: string): Strategy[] {
    return strategyRepo.listByUser(userId);
  },

  get(userId: string, id: string): Strategy {
    const strategy = strategyRepo.findById(id);
    if (!strategy) throw new NotFoundError('Strategy');
    assertOwnership(strategy, userId);
    return strategy;
  },

  create(userId: string, input: StrategyInput): Strategy {
    validateRules(input);
    const now = new Date().toISOString();
    const strategy: Strategy = {
      id: generateId(),
      userId,
      name: input.name,
      description: input.description ?? '',
      assetClass: input.assetClass,
      symbol: input.symbol,
      timeframe: input.timeframe,
      direction: input.direction,
      entryRules: input.entryRules,
      exitRules: input.exitRules,
      positionSizing: input.positionSizing,
      riskControls: input.riskControls,
      schedule: input.schedule,
      status: input.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
    };
    strategyRepo.create(strategy);
    return strategy;
  },

  update(userId: string, id: string, input: StrategyInput): Strategy {
    const existing = this.get(userId, id);
    validateRules(input);
    const updated: Strategy = {
      ...existing,
      name: input.name,
      description: input.description ?? existing.description,
      assetClass: input.assetClass,
      symbol: input.symbol,
      timeframe: input.timeframe,
      direction: input.direction,
      entryRules: input.entryRules,
      exitRules: input.exitRules,
      positionSizing: input.positionSizing,
      riskControls: input.riskControls,
      schedule: input.schedule,
      status: input.status ?? existing.status,
      updatedAt: new Date().toISOString(),
    };
    strategyRepo.update(updated);
    return updated;
  },

  remove(userId: string, id: string): void {
    const strategy = this.get(userId, id);
    const bots = botRepo.listByUser(userId).filter((b) => b.strategyId === strategy.id);
    if (bots.length > 0) {
      throw new ConflictError('This strategy has bots attached to it. Stop and delete those bots first.');
    }
    strategyRepo.delete(strategy.id);
  },
};
