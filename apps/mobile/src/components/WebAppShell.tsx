import React, { PropsWithChildren } from 'react';
import { Platform, View } from 'react-native';
import { useTheme } from '../theme';

const MAX_WIDTH = 480;

/**
 * On web, the app renders full-bleed by default (it's built mobile-first).
 * Above the phone breakpoint this centers everything into a fixed-width
 * column with a framed look, instead of stretching cards/charts/tab bar
 * edge-to-edge across a desktop browser window. On native it's a no-op.
 */
export function WebAppShell({ children }: PropsWithChildren) {
  const { palette, isDark } = useTheme();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        backgroundColor: isDark ? '#000000' : '#DCE1E8',
        minHeight: '100vh' as unknown as number,
      }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: MAX_WIDTH,
          backgroundColor: palette.bg,
          boxShadow: isDark ? '0 0 60px rgba(0,0,0,0.6)' : '0 0 40px rgba(0,0,0,0.12)',
        }}
      >
        {children}
      </View>
    </View>
  );
}
