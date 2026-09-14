import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BotsStackParamList } from './types';
import { themedStackOptions } from './screenOptions';
import { useTheme } from '../theme';
import { BotMonitorScreen } from '../screens/bots/BotMonitorScreen';
import { BotDetailScreen } from '../screens/bots/BotDetailScreen';

const Stack = createNativeStackNavigator<BotsStackParamList>();

export function BotsStackNavigator() {
  const { palette } = useTheme();
  return (
    <Stack.Navigator screenOptions={themedStackOptions(palette)}>
      <Stack.Screen name="BotMonitor" component={BotMonitorScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BotDetail" component={BotDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
