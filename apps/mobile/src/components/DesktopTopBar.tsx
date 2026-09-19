import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { spacing } from '../theme/tokens';
import { useAuthStore } from '../store/authStore';
import { Avatar, Badge, Text } from './ui';
import { isUsMarketOpenNow } from '../utils/marketHours';

/** Top bar shown above the sidebar+content on desktop-width web only — see WebAppShell/MainTabNavigator for the breakpoint. */
export function DesktopTopBar() {
  const { palette } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [marketOpen, setMarketOpen] = useState(() => isUsMarketOpenNow());

  useEffect(() => {
    const id = setInterval(() => setMarketOpen(isUsMarketOpenNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <View
      style={{
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: palette.divider,
        backgroundColor: palette.bgElevated,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: palette.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Feather name="trending-up" color={palette.onAccent} size={18} />
        </View>
        <Text variant="h3">Right Trade</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
        <Badge label={marketOpen ? 'Market open' : 'Market closed'} tone={marketOpen ? 'positive' : 'neutral'} dot />
        {user && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Avatar name={user.displayName} color={user.avatarColor} size={32} />
            <Text variant="bodyMedium">{user.displayName}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
