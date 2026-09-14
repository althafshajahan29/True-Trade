import React from 'react';
import { StyleProp, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  suffix?: string;
}

export function Input({ label, error, containerStyle, suffix, style, ...rest }: InputProps) {
  const { palette } = useTheme();

  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label && (
        <Text variant="caption" tone="secondary">
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: palette.inputBg,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? palette.negative : palette.cardBorder,
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          placeholderTextColor={palette.textTertiary}
          style={[
            {
              flex: 1,
              color: palette.textPrimary,
              fontSize: 15,
              paddingVertical: spacing.md,
            },
            style,
          ]}
          {...rest}
        />
        {suffix && (
          <Text variant="caption" tone="tertiary">
            {suffix}
          </Text>
        )}
      </View>
      {error && (
        <Text variant="caption" tone="negative">
          {error}
        </Text>
      )}
    </View>
  );
}
