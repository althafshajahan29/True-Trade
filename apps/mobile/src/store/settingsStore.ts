import { NotificationPreferences, ThemePreference, UserSettings } from '@right-trade/shared';
import { create } from 'zustand';
import { meApi } from '../api/endpoints';

const DEFAULT_SETTINGS: UserSettings = {
  userId: '',
  theme: 'dark',
  currency: 'USD',
  notifications: {
    userId: '',
    pushEnabled: true,
    botErrorAlerts: true,
    riskAlerts: true,
    tradeExecutionAlerts: true,
    priceAlerts: true,
  },
};

interface SettingsState {
  settings: UserSettings;
  isLoading: boolean;
  load: () => Promise<void>;
  setTheme: (theme: ThemePreference) => Promise<void>;
  setCurrency: (currency: UserSettings['currency']) => Promise<void>;
  setNotificationPref: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const settings = await meApi.getSettings();
      set({ settings, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setTheme: async (theme) => {
    const next = { ...get().settings, theme };
    set({ settings: next });
    await meApi.updateSettings(next).catch(() => undefined);
  },

  setCurrency: async (currency) => {
    const next = { ...get().settings, currency };
    set({ settings: next });
    await meApi.updateSettings(next).catch(() => undefined);
  },

  setNotificationPref: async (key, value) => {
    const next = { ...get().settings, notifications: { ...get().settings.notifications, [key]: value } };
    set({ settings: next });
    await meApi.updateSettings(next).catch(() => undefined);
  },
}));
