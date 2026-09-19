import React from 'react';
import { View } from 'react-native';
import { classifyScore } from '@right-trade/shared';
import { useTheme } from '../../theme';
import { spacing } from '../../theme/tokens';
import { ScoreBar } from './ScoreBar';
import { Text } from './Text';

interface MarketPulseGaugeProps {
  /** -100 (bearish) .. +100 (bullish), typically an average of several SignalScore.compositeScore values. */
  score: number;
  label?: string;
}

/** A larger, end-labeled version of ScoreBar for an at-a-glance aggregate reading. */
export function MarketPulseGauge({ score, label = 'Market pulse' }: MarketPulseGaugeProps) {
  const { palette } = useTheme();
  const classification = classifyScore(score);
  const tone = classification.includes('bullish') ? palette.positive : classification.includes('bearish') ? palette.negative : palette.textSecondary;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
          <Text variant="h2" style={{ color: tone }}>
            {Math.round(score)}
          </Text>
          <Text variant="caption" tone="secondary" style={{ textTransform: 'capitalize' }}>
            {classification.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <ScoreBar score={score} height={10} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="micro" tone="secondary">
          BEARISH
        </Text>
        <Text variant="micro" tone="secondary">
          BULLISH
        </Text>
      </View>
    </View>
  );
}
