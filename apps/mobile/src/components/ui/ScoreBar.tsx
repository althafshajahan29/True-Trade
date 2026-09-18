import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme';

interface ScoreBarProps {
  /** -100 (bearish) .. +100 (bullish) */
  score: number;
  height?: number;
}

export function ScoreBar({ score, height = 8 }: ScoreBarProps) {
  const { palette } = useTheme();
  const clamped = Math.max(-100, Math.min(100, score));
  const positive = clamped >= 0;
  const fillPercent = Math.abs(clamped) / 2; // half-track either side of center

  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: palette.cardBorder, overflow: 'hidden' }}>
      <View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: positive ? '50%' : `${50 - fillPercent}%`,
          width: `${fillPercent}%`,
          backgroundColor: positive ? palette.positive : palette.negative,
        }}
      />
    </View>
  );
}
