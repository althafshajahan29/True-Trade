import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { AuthNavigator } from './AuthNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { RiskDisclaimerScreen } from '../screens/onboarding/RiskDisclaimerScreen';

export function RootNavigator() {
  const { palette } = useTheme();
  const { token, user, hasHydrated, refreshProfile } = useAuthStore();
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    if (hasHydrated && token) {
      refreshProfile();
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHydrated, token]);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  if (!token || !user) {
    return <AuthNavigator />;
  }

  if (!user.riskDisclaimerAcceptedAt) {
    return <RiskDisclaimerScreen />;
  }

  return <MainTabNavigator />;
}
