import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { WebAppShell } from './src/components/WebAppShell';

export default function App() {
  const { palette, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: palette.accent,
      background: palette.bg,
      card: palette.bg,
      text: palette.textPrimary,
      border: palette.divider,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <WebAppShell>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </WebAppShell>
    </SafeAreaProvider>
  );
}
