import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../../theme';
import { spacing } from '../../theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  const { palette } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl, gap: spacing.md }}>
      <ActivityIndicator color={palette.accent} />
      <Text variant="body" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

export function ErrorState({
  message = 'Something went wrong.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl, gap: spacing.md }}>
      <Text variant="h3">Couldn't load this</Text>
      <Text variant="body" tone="secondary" style={{ textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry && <Button label="Try again" onPress={onRetry} variant="secondary" fullWidth={false} />}
    </View>
  );
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl, gap: spacing.sm }}>
      {icon}
      <Text variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {message && (
        <Text variant="body" tone="secondary" style={{ textAlign: 'center', maxWidth: 280 }}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={{ marginTop: spacing.sm }} />
      )}
    </View>
  );
}
