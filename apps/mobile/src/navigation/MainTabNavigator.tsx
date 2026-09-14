import React from 'react';
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { useTheme } from '../theme';
import { DashboardStackNavigator } from './DashboardStackNavigator';
import { StrategiesStackNavigator } from './StrategiesStackNavigator';
import { BotsStackNavigator } from './BotsStackNavigator';
import { MarketplaceStackNavigator } from './MarketplaceStackNavigator';
import { MoreStackNavigator } from './MoreStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = keyof typeof Feather.glyphMap;

const ICONS: Record<keyof MainTabParamList, IconName> = {
  DashboardTab: 'home',
  StrategiesTab: 'sliders',
  BotsTab: 'cpu',
  MarketplaceTab: 'users',
  MoreTab: 'more-horizontal',
};

export function MainTabNavigator() {
  const { palette } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textTertiary,
        tabBarStyle: { backgroundColor: palette.tabBarBg, borderTopColor: palette.divider },
        tabBarIcon: ({ color, size }) => (
          <Feather name={ICONS[route.name as keyof MainTabParamList]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackNavigator} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="StrategiesTab" component={StrategiesStackNavigator} options={{ title: 'Strategies' }} />
      <Tab.Screen name="BotsTab" component={BotsStackNavigator} options={{ title: 'Bots' }} />
      <Tab.Screen name="MarketplaceTab" component={MarketplaceStackNavigator} options={{ title: 'Copy' }} />
      <Tab.Screen name="MoreTab" component={MoreStackNavigator} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}
