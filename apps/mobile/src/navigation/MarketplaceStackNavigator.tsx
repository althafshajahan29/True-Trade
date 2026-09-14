import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MarketplaceStackParamList } from './types';
import { themedStackOptions } from './screenOptions';
import { useTheme } from '../theme';
import { MarketplaceScreen } from '../screens/marketplace/MarketplaceScreen';
import { ProviderProfileScreen } from '../screens/marketplace/ProviderProfileScreen';

const Stack = createNativeStackNavigator<MarketplaceStackParamList>();

export function MarketplaceStackNavigator() {
  const { palette } = useTheme();
  return (
    <Stack.Navigator screenOptions={themedStackOptions(palette)}>
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProviderProfile" component={ProviderProfileScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
