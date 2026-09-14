import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Button, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { palette } = useTheme();

  return (
    <Screen scroll={false} edges={['top', 'bottom']}>
      <View style={{ flex: 1, justifyContent: 'space-between', paddingVertical: spacing.xxl }}>
        <View style={{ gap: spacing.md, marginTop: spacing.xxxl }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: palette.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="h1" tone="onAccent">
              R
            </Text>
          </View>
          <Text variant="display">Right Trade</Text>
          <Text variant="bodyLg" tone="secondary" style={{ maxWidth: 320 }}>
            Build, backtest, and automate your own trading strategies — or copy the ones that already work.
          </Text>
        </View>

        <View style={{ gap: spacing.lg }}>
          <View
            style={{
              backgroundColor: palette.accentMuted,
              borderRadius: 16,
              padding: spacing.lg,
              gap: spacing.xs,
            }}
          >
            <Text variant="bodyMedium" tone="accent">
              Paper trading first
            </Text>
            <Text variant="body" tone="secondary">
              Every new account starts in simulated paper trading with virtual funds. No real money is ever placed
              automatically — you decide when (and if) to go live.
            </Text>
          </View>

          <View style={{ gap: spacing.md }}>
            <Button label="Create free account" onPress={() => navigation.navigate('SignUp')} />
            <Button label="I already have an account" variant="secondary" onPress={() => navigation.navigate('SignIn')} />
          </View>
        </View>
      </View>
    </Screen>
  );
}
