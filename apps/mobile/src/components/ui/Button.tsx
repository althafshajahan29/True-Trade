import React from 'react';
import { ActivityIndicator, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  fullWidth = true,
}: ButtonProps) {
  const { palette } = useTheme();
  const isDisabled = disabled || loading;

  const backgrounds: Record<Variant, string> = {
    primary: palette.accent,
    secondary: palette.card,
    danger: palette.negative,
    ghost: 'transparent',
  };
  const borders: Record<Variant, string> = {
    primary: palette.accent,
    secondary: palette.cardBorder,
    danger: palette.negative,
    ghost: 'transparent',
  };
  const textTone: Record<Variant, 'onAccent' | 'primary'> = {
    primary: 'onAccent',
    secondary: 'primary',
    danger: 'onAccent',
    ghost: 'primary',
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: backgrounds[variant],
          borderWidth: 1,
          borderColor: borders[variant],
          borderRadius: radius.md,
          paddingVertical: size === 'md' ? spacing.md : spacing.sm,
          paddingHorizontal: spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? palette.accent : palette.onAccent} />
      ) : (
        <Text variant="bodyMedium" tone={textTone[variant]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
