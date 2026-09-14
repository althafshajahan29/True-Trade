import { DEFAULT_RISK_SETTINGS, RiskSettings } from '@right-trade/shared';
import { riskSettingsRepo } from '../repositories/riskSettings.repo';

export const riskService = {
  get(userId: string): RiskSettings {
    return (
      riskSettingsRepo.findByUserId(userId) ?? {
        ...DEFAULT_RISK_SETTINGS,
        userId,
        updatedAt: new Date().toISOString(),
      }
    );
  },

  update(userId: string, input: Omit<RiskSettings, 'userId' | 'updatedAt'>): RiskSettings {
    const settings: RiskSettings = { ...input, userId, updatedAt: new Date().toISOString() };
    riskSettingsRepo.upsert(settings);
    return settings;
  },
};
