import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

export type BadgeTone = 'positive' | 'negative' | 'warning' | 'accent' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
}

export function Badge({ label, tone = 'neutral', dot = false }: BadgeProps) {
  const { palette } = useTheme();

  const config: Record<BadgeTone, { bg: string; fg: string }> = {
    positive: { bg: palette.positiveMuted, fg: palette.positive },
    negative: { bg: palette.negativeMuted, fg: palette.negative },
    warning: { bg: palette.warningMuted, fg: palette.warning },
    accent: { bg: palette.accentMuted, fg: palette.accent },
    neutral: { bg: palette.cardBorder, fg: palette.textSecondary },
  };
  const { bg, fg } = config[tone];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingVertical: spacing.xxs + 2,
        paddingHorizontal: spacing.sm + 2,
        gap: spacing.xs,
      }}
    >
      {dot && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />}
      <Text variant="micro" style={{ color: fg }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

export function botStatusTone(status: string): BadgeTone {
  switch (status) {
    case 'running':
      return 'positive';
    case 'paused':
      return 'warning';
    case 'error':
      return 'negative';
    default:
      return 'neutral';
  }
}
