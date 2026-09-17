import React, { PropsWithChildren } from 'react';
import { RefreshControl, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { spacing } from '../../theme/tokens';

interface ScreenProps {
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  refreshing,
  onRefresh,
  edges = ['top'],
}: PropsWithChildren<ScreenProps>) {
  const { palette } = useTheme();

  const content = (
    <View style={[{ flex: 1, padding: spacing.lg, paddingBottom: spacing.xxxl }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: palette.bg }, style]} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={palette.accent}
                colors={[palette.accent]}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
