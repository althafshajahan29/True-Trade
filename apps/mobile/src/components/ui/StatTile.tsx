import React from 'react';
import { View } from 'react-native';
import { spacing } from '../../theme/tokens';
import { Card } from './Card';
import { Text } from './Text';

interface StatTileProps {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'positive' | 'negative' | 'secondary';
  style?: object;
}

export function StatTile({ label, value, delta, deltaTone = 'secondary', style }: StatTileProps) {
  return (
    <Card style={[{ flex: 1, gap: spacing.xs }, style]}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="h2">{value}</Text>
      {delta && (
        <Text variant="caption" tone={deltaTone}>
          {delta}
        </Text>
      )}
    </Card>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: spacing.md }}>{children}</View>;
}
