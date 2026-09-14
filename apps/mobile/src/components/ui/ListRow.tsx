import React from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useTheme } from '../../theme';
import { spacing } from '../../theme/tokens';
import { Text } from './Text';

interface ListRowProps {
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

export function ListRow({ label, subtitle, value, onPress, showChevron, switchValue, onSwitchChange }: ListRowProps) {
  const { palette } = useTheme();
  const isSwitchRow = switchValue !== undefined;

  const inner = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.md,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="body">{label}</Text>
        {subtitle && (
          <Text variant="caption" tone="secondary">
            {subtitle}
          </Text>
        )}
      </View>
      {isSwitchRow ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: palette.cardBorder, true: palette.accent }}
          thumbColor="#FFFFFF"
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          {value && (
            <Text variant="body" tone="secondary">
              {value}
            </Text>
          )}
          {showChevron && (
            <Text variant="body" tone="tertiary">
              ›
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (isSwitchRow || !onPress) return inner;

  return <Pressable onPress={onPress}>{inner}</Pressable>;
}
