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
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: palette.cardBorder,
          padding: padded ? spacing.lg : 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.24,
          shadowRadius: 12,
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
