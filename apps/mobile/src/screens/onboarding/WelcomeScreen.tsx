import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button, Card, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

const FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; body: string }[] = [
  { icon: 'sliders', title: 'Build & backtest strategies', body: 'Compose rule-based strategies and validate them against historical data before risking a cent.' },
  { icon: 'users', title: 'Copy proven traders', body: "Subscribe to a provider's live performance and mirror their trades automatically." },
  { icon: 'activity', title: 'Real-time market intelligence', body: 'Transparent technical momentum, explosive-demand screening, and live news sentiment.' },
];

export function WelcomeScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const isDesktop = useIsDesktop();

  const brandBlock = (
    <View style={{ gap: spacing.md }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="h1" tone="onAccent">
          R
        </Text>
      </View>
      <Text variant="display">Right Trade</Text>
      <Text variant="bodyLg" tone="secondary" style={{ maxWidth: 420 }}>
        Build, backtest, and automate your own trading strategies — or copy the ones that already work.
      </Text>
    </View>
  );

  const ctaBlock = (
    <View style={{ gap: spacing.lg }}>
      <View style={{ backgroundColor: palette.accentMuted, borderRadius: 16, padding: spacing.lg, gap: spacing.xs }}>
        <Text variant="bodyMedium" tone="accent">
          Paper trading first
        </Text>
        <Text variant="body" tone="secondary">
          Every new account starts in simulated paper trading with virtual funds. No real money is ever placed
          automatically — you decide when (and if) to go live.
        </Text>
      </View>

      <View style={{ gap: spacing.md, ...(isDesktop ? { maxWidth: 320 } : {}) }}>
        <Button label="Create free account" onPress={() => navigation.navigate('SignUp')} />
        <Button label="I already have an account" variant="secondary" onPress={() => navigation.navigate('SignIn')} />
      </View>
    </View>
  );

  if (isDesktop) {
    return (
      <Screen edges={['top', 'bottom']}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xxxl * 2, paddingVertical: spacing.xxxl }}>
          <View style={{ flex: 1, gap: spacing.xxl, maxWidth: 480 }}>
            {brandBlock}
            {ctaBlock}
          </View>
          <View style={{ flex: 1, gap: spacing.lg }}>
            {FEATURES.map((f) => (
              <Card key={f.title} style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: palette.accentMuted, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name={f.icon} color={palette.accent} size={20} />
                </View>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text variant="bodyMedium">{f.title}</Text>
                  <Text variant="body" tone="secondary">
                    {f.body}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ gap: spacing.xxxl, paddingVertical: spacing.xxl }}>
        {brandBlock}
        {ctaBlock}
      </View>
    </Screen>
  );
}
