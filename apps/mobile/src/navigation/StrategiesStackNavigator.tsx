import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StrategiesStackParamList } from './types';
import { themedStackOptions } from './screenOptions';
import { useTheme } from '../theme';
import { StrategyListScreen } from '../screens/strategy/StrategyListScreen';
import { StrategyBuilderScreen } from '../screens/strategy/StrategyBuilderScreen';
import { BacktestLabScreen } from '../screens/backtest/BacktestLabScreen';
import { BacktestResultScreen } from '../screens/backtest/BacktestResultScreen';

const Stack = createNativeStackNavigator<StrategiesStackParamList>();

export function StrategiesStackNavigator() {
  const { palette } = useTheme();
  return (
    <Stack.Navigator screenOptions={themedStackOptions(palette)}>
      <Stack.Screen name="StrategyList" component={StrategyListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="StrategyBuilder" component={StrategyBuilderScreen} options={{ title: '' }} />
      <Stack.Screen name="BacktestLab" component={BacktestLabScreen} options={{ title: '' }} />
      <Stack.Screen name="BacktestResult" component={BacktestResultScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
