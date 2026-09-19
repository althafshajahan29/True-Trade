import React, { PropsWithChildren } from 'react';
import { Platform, View } from 'react-native';
import { useTheme } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';

const PHONE_MAX_WIDTH = 480;
const DESKTOP_MAX_WIDTH = 1200;

/**
 * On web this switches between two looks depending on viewport width:
 *  - Narrow (phone-width) browsers: the app is framed into a fixed-width
 *    centered column with a subtle shadow, like a phone screen — this is
 *    the "app mode" a phone browser or a narrow window gets.
 *  - Desktop-width browsers: a wide, flat content column with no phone
 *    framing, paired with the sidebar navigation MainTabNavigator switches
 *    to at the same breakpoint — this is the "website" look.
 * On native (iOS/Android) this is a no-op.
 */
export function WebAppShell({ children }: PropsWithChildren) {
  const { palette, isDark } = useTheme();
  const isDesktop = useIsDesktop();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  if (isDesktop) {
    return (
      <View style={{ flex: 1, alignItems: 'center', backgroundColor: palette.bg, minHeight: '100vh' as unknown as number }}>
        <View style={{ flex: 1, width: '100%', maxWidth: DESKTOP_MAX_WIDTH, backgroundColor: palette.bg }}>{children}</View>
      </View>
    );
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
          maxWidth: PHONE_MAX_WIDTH,
          backgroundColor: palette.bg,
          boxShadow: isDark ? '0 0 60px rgba(0,0,0,0.6)' : '0 0 40px rgba(0,0,0,0.12)',
        }}
      >
        {children}
      </View>
    </View>
  );
}
