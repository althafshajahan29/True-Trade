import React from 'react';
import { ScrollView, Pressable, View } from 'react-native';
import { useTheme } from '../../theme';
import { radius, spacing } from '../../theme/tokens';
import { Text } from './Text';

interface PillTabsProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
}

export function PillTabs<T extends string>({ options, value, onChange, scrollable = true }: PillTabsProps<T>) {
  const { palette } = useTheme();

  const content = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radius.pill,
              backgroundColor: selected ? palette.accent : palette.card,
              borderWidth: 1,
              borderColor: selected ? palette.accent : palette.cardBorder,
            }}
          >
            <Text variant="bodyMedium" tone={selected ? 'onAccent' : 'secondary'}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!scrollable) return content;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {content}
    </ScrollView>
  );
}
