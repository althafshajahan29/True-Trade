import { Bot, BotLogEntry, BotSignal, CreateBotRequest, generateId, Position, Trade } from '@right-trade/shared';
import { botRepo } from '../repositories/bot.repo';
import { positionRepo } from '../repositories/position.repo';
import { tradeRepo } from '../repositories/trade.repo';
import { riskSettingsRepo } from '../repositories/riskSettings.repo';
import { userRepo } from '../repositories/user.repo';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { strategyService } from './strategy.service';
import { DEFAULT_RISK_SETTINGS } from '@right-trade/shared';

function assertOwnership(bot: Bot, userId: string): void {
  if (bot.userId !== userId) throw new ForbiddenError();
}

export const botService = {
  list(userId: string): Bot[] {
    return botRepo.listByUser(userId);
  },

  get(userId: string, id: string): Bot {
    const bot = botRepo.findById(id);
    if (!bot) throw new NotFoundError('Bot');
    assertOwnership(bot, userId);
    return bot;
  },

  getDetail(userId: string, id: string): {
    bot: Bot;
    positions: Position[];
    trades: Trade[];
    signals: BotSignal[];
    logs: BotLogEntry[];
  } {
    const bot = this.get(userId, id);
    return {
      bot,
      positions: positionRepo.listByUser(userId).filter((p) => p.botId === bot.id),
      trades: tradeRepo.listByBot(bot.id),
      signals: botRepo.listSignals(bot.id),
      logs: botRepo.listLogs(bot.id),
    };
  },

  create(userId: string, input: CreateBotRequest): Bot {
    const strategy = strategyService.get(userId, input.strategyId);
    if (strategy.status === 'archived') {
      throw new ValidationError('This strategy is archived. Reactivate it before creating a bot.');
    }

    const balance = userRepo.getPaperBalance(userId);
    const riskSettings = riskSettingsRepo.findByUserId(userId) ?? {
      ...DEFAULT_RISK_SETTINGS,
      userId,
      updatedAt: new Date().toISOString(),
    };
    const maxCapital = balance * (riskSettings.maxCapitalPerBotPercent / 100);
    if (balance > 0 && input.allocatedCapital > maxCapital) {
      throw new ValidationError(
        `Allocated capital exceeds your risk limit of ${riskSettings.maxCapitalPerBotPercent}% of account balance ($${maxCapital.toFixed(2)}).`,
      );
    }

    const now = new Date().toISOString();
    const bot: Bot = {
      id: generateId(),
      userId,
      strategyId: strategy.id,
      name: input.name,
      status: 'stopped',
      mode: input.mode ?? 'paper',
      allocatedCapital: input.allocatedCapital,
      createdAt: now,
      updatedAt: now,
      lastErrorMessage: null,
      lastSignalAt: null,
    };
    botRepo.create(bot);
    botRepo.addLog({ id: generateId(), botId: bot.id, level: 'info', message: 'Bot created.', createdAt: now });
    return bot;
  },

  clone(userId: string, id: string): Bot {
    const source = this.get(userId, id);
    const now = new Date().toISOString();
    const clone: Bot = {
      ...source,
      id: generateId(),
      name: `${source.name} (copy)`,
      status: 'stopped',
      createdAt: now,
      updatedAt: now,
      lastErrorMessage: null,
      lastSignalAt: null,
    };
    botRepo.create(clone);
    botRepo.addLog({ id: generateId(), botId: clone.id, level: 'info', message: `Cloned from "${source.name}".`, createdAt: now });
    return clone;
  },

  start(userId: string, id: string): Bot {
    const bot = this.get(userId, id);
    if (bot.status === 'running') return bot;
    botRepo.updateStatus(id, 'running', null);
    botRepo.addLog({ id: generateId(), botId: id, level: 'info', message: 'Bot started.', createdAt: new Date().toISOString() });
    return this.get(userId, id);
  },

  pause(userId: string, id: string): Bot {
    const bot = this.get(userId, id);
    if (bot.status !== 'running') {
      throw new ConflictError('Only a running bot can be paused.');
    }
    botRepo.updateStatus(id, 'paused', null);
    botRepo.addLog({ id: generateId(), botId: id, level: 'info', message: 'Bot paused.', createdAt: new Date().toISOString() });
    return this.get(userId, id);
  },

  resume(userId: string, id: string): Bot {
    const bot = this.get(userId, id);
    if (bot.status !== 'paused') {
      throw new ConflictError('Only a paused bot can be resumed.');
    }
    botRepo.updateStatus(id, 'running', null);
    botRepo.addLog({ id: generateId(), botId: id, level: 'info', message: 'Bot resumed.', createdAt: new Date().toISOString() });
    return this.get(userId, id);
  },

  stop(userId: string, id: string): Bot {
    this.get(userId, id);
    botRepo.updateStatus(id, 'stopped', null);
    botRepo.addLog({ id: generateId(), botId: id, level: 'info', message: 'Bot stopped.', createdAt: new Date().toISOString() });
    return this.get(userId, id);
  },

  remove(userId: string, id: string): void {
    const bot = this.get(userId, id);
    if (bot.status === 'running') {
      throw new ConflictError('Stop the bot before deleting it.');
    }
    botRepo.delete(id);
  },
};
