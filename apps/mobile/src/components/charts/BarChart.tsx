import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';
import { spacing } from '../../theme/tokens';
import { Text } from '../ui/Text';

interface BarDatum {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
}

export function BarChart({ data, height = 140 }: BarChartProps) {
  const { palette } = useTheme();
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: spacing.sm }}>
      {data.map((d) => {
        const barHeight = Math.max((Math.abs(d.value) / max) * (height - 28), 3);
        const positive = d.value >= 0;
        return (
          <View key={d.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
            <View
              style={{
                width: '70%',
                height: barHeight,
                backgroundColor: positive ? palette.positive : palette.negative,
                borderRadius: 4,
              }}
            />
            <Text variant="micro" tone="tertiary" numberOfLines={1} style={{ marginTop: spacing.xs }}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
