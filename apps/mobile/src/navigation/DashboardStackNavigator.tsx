import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardStackParamList } from './types';
import { themedStackOptions } from './screenOptions';
import { useTheme } from '../theme';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { BotDetailScreen } from '../screens/bots/BotDetailScreen';
import { TradeHistoryScreen } from '../screens/trades/TradeHistoryScreen';
import { AlertsScreen } from '../screens/alerts/AlertsScreen';

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export function DashboardStackNavigator() {
  const { palette } = useTheme();
  return (
    <Stack.Navigator screenOptions={themedStackOptions(palette)}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BotDetail" component={BotDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="TradeHistory" component={TradeHistoryScreen} options={{ title: '' }} />
      <Stack.Screen name="Alerts" component={AlertsScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
