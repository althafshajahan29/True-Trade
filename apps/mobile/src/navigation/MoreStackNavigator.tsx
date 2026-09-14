import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreStackParamList } from './types';
import { themedStackOptions } from './screenOptions';
import { useTheme } from '../theme';
import { MoreScreen } from '../screens/settings/MoreScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { AlertsScreen } from '../screens/alerts/AlertsScreen';
import { RiskSettingsScreen } from '../screens/risk/RiskSettingsScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { TradeHistoryScreen } from '../screens/trades/TradeHistoryScreen';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStackNavigator() {
  const { palette } = useTheme();
  return (
    <Stack.Navigator screenOptions={themedStackOptions(palette)}>
      <Stack.Screen name="More" component={MoreScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: '' }} />
      <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: '' }} />
      <Stack.Screen name="RiskSettings" component={RiskSettingsScreen} options={{ title: '' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '' }} />
      <Stack.Screen name="TradeHistory" component={TradeHistoryScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
