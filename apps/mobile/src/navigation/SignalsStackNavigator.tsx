import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignalsStackParamList } from './types';
import { themedStackOptions } from './screenOptions';
import { useTheme } from '../theme';
import { SignalsScreen } from '../screens/signals/SignalsScreen';
import { SignalDetailScreen } from '../screens/signals/SignalDetailScreen';

const Stack = createNativeStackNavigator<SignalsStackParamList>();

export function SignalsStackNavigator() {
  const { palette } = useTheme();
  return (
    <Stack.Navigator screenOptions={themedStackOptions(palette)}>
      <Stack.Screen name="Signals" component={SignalsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignalDetail" component={SignalDetailScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
