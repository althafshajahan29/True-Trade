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
    // flexGrow/flexBasis + minWidth inside a wrapping row (see StatGrid) is
    // the classic "auto-fit grid" trick: 2-across on a phone, naturally
    // reflows to 3-4-across as the container gets wider on desktop.
    <Card style={[{ flexGrow: 1, flexBasis: 160, minWidth: 160, gap: spacing.xs }, style]}>
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

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>{children}</View>;
}
