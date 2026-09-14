import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../../theme';
import { typography } from '../../theme/tokens';

type Variant = keyof typeof typography;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'positive' | 'negative' | 'warning' | 'accent' | 'onAccent';

interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
}

export function Text({ variant = 'body', tone = 'primary', style, ...rest }: TextProps) {
  const { palette } = useTheme();
  const toneColor: Record<Tone, string> = {
    primary: palette.textPrimary,
    secondary: palette.textSecondary,
    tertiary: palette.textTertiary,
    positive: palette.positive,
    negative: palette.negative,
    warning: palette.warning,
    accent: palette.accent,
    onAccent: palette.onAccent,
  };

  return <RNText style={[typography[variant], { color: toneColor[tone] }, style]} {...rest} />;
}
