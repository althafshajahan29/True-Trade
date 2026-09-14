import React, { PropsWithChildren } from 'react';
import { Pressable, View } from 'react-native';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { Text } from './Text';

interface SectionProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Section({ title, actionLabel, onAction, children }: PropsWithChildren<SectionProps>) {
  const { palette } = useTheme();
  return (
    <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="h3">{title}</Text>
        {actionLabel && onAction && (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text variant="caption" style={{ color: palette.accent }}>
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}
