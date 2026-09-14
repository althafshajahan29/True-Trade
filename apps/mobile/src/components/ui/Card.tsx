import React, { PropsWithChildren } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { radius, spacing } from '../../theme/tokens';

interface CardProps {
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: PropsWithChildren<CardProps>) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: palette.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: palette.cardBorder,
          padding: padded ? spacing.lg : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
