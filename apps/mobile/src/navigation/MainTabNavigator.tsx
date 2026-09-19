import React from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { useTheme } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { DesktopTopBar } from '../components/DesktopTopBar';
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
  const isDesktop = useIsDesktop();

  const navigator = (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // On a desktop-width browser this renders as a left sidebar instead
        // of a bottom bar (native support in @react-navigation/bottom-tabs)
        // — the single biggest visual cue that this is a website, not a
        // phone app. Phones (native or narrow web) keep the bottom tab bar.
        tabBarPosition: isDesktop ? 'left' : 'bottom',
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.textTertiary,
        // Left-rail mode fills the active item with a solid background by
        // default — without an explicit (muted) color here it comes out as
        // solid accent, which makes the accent-tinted icon/label invisible
        // against it.
        tabBarActiveBackgroundColor: isDesktop ? palette.accentMuted : undefined,
        tabBarStyle: isDesktop
          ? { backgroundColor: palette.tabBarBg, borderRightColor: palette.divider, borderRightWidth: 1, width: 220 }
          : { backgroundColor: palette.tabBarBg, borderTopColor: palette.divider },
        tabBarLabelPosition: isDesktop ? 'beside-icon' : undefined,
        tabBarItemStyle: isDesktop
          ? { flexDirection: 'row', justifyContent: 'flex-start', paddingHorizontal: 16, marginHorizontal: 8, borderRadius: 10 }
          : undefined,
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

  if (!isDesktop) return navigator;

  return (
    <View style={{ flex: 1 }}>
      <DesktopTopBar />
      <View style={{ flex: 1 }}>{navigator}</View>
    </View>
  );
}
