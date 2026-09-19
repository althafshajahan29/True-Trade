import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useIsDesktop } from '../../hooks/useIsDesktop';

export function RiskDisclaimerScreen() {
  const { palette } = useTheme();
  const [accepting, setAccepting] = useState(false);
  const acceptRiskDisclaimer = useAuthStore((s) => s.acceptRiskDisclaimer);
  const isDesktop = useIsDesktop();

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await acceptRiskDisclaimer();
    } finally {
      setAccepting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <ScrollView
        contentContainerStyle={
          isDesktop
            ? { padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 640, alignSelf: 'center', width: '100%' }
            : { padding: spacing.lg, paddingBottom: spacing.xxxl }
        }
      >
        <Text variant="h1">Before you start trading</Text>
        <Text variant="body" tone="secondary" style={{ marginTop: spacing.sm }}>
          Please read and accept the following before using Right Trade.
        </Text>

        <View style={{ gap: spacing.lg, marginTop: spacing.xxl }}>
          <DisclaimerPoint
            title="You're starting in paper trading"
            body="All strategies, bots, and copy-trading subscriptions run against a simulated account with virtual funds by default. No real orders are placed unless you explicitly enable live trading with a connected broker."
          />
          <DisclaimerPoint
            title="Trading involves risk"
            body="Backtested and simulated performance does not guarantee future results. Markets are volatile, and strategies that performed well historically can lose money going forward."
          />
          <DisclaimerPoint
            title="Automated strategies can fail"
            body="Bots execute rules exactly as configured, including during unexpected market conditions. Always set stop losses, position limits, and review your Risk Manager settings."
          />
          <DisclaimerPoint
            title="Copy trading is not investment advice"
            body="Provider performance shown in the marketplace is historical and simulated. Allocating capital to a provider carries the same risks as trading yourself."
          />
        </View>

        <Button
          label="I understand & accept"
          onPress={handleAccept}
          loading={accepting}
          style={{ marginTop: spacing.xxl }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DisclaimerPoint({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="bodyMedium">{title}</Text>
      <Text variant="body" tone="secondary">
        {body}
      </Text>
    </View>
  );
}
