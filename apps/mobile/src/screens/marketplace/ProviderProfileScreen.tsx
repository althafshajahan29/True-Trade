import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { CopySubscription } from '@right-trade/shared';
import { Avatar, Badge, Button, Card, ErrorState, Input, LoadingState, Screen, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { providersApi, subscriptionsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { ApiError } from '../../api/client';
import { formatCompactNumber, formatCurrency, formatPercent } from '../../utils/format';
import { EquityCurveChart } from '../../components/charts/EquityCurveChart';
import { BarChart } from '../../components/charts/BarChart';
import { MarketplaceStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'ProviderProfile'>;

export function ProviderProfileScreen({ route }: Props) {
  const { providerId } = route.params;
  const { palette } = useTheme();
  const provider = useAsync(() => providersApi.get(providerId), [providerId]);

  const [subscription, setSubscription] = useState<CopySubscription | null>(null);
  const [allocation, setAllocation] = useState('1000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSubscription = () => {
    subscriptionsApi
      .list()
      .then((subs) => setSubscription(subs.find((s) => s.providerId === providerId && s.status === 'active') ?? null))
      .catch(() => undefined);
  };

  useEffect(loadSubscription, [providerId]);

  const handleSubscribe = async () => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      await subscriptionsApi.create({ providerId, allocation: Number(allocation) || 0 });
      loadSubscription();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not start copying this provider.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;
    setIsSubmitting(true);
    try {
      await subscriptionsApi.remove(subscription.id);
      setSubscription(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not stop copying.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (provider.isLoading) return <Screen><LoadingState label="Loading provider…" /></Screen>;
  if (provider.error || !provider.data) {
    return (
      <Screen>
        <ErrorState message={provider.error ?? undefined} onRetry={provider.refetch} />
      </Screen>
    );
  }

  const p = provider.data;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Avatar name={p.displayName} color={p.avatarColor} size={56} />
        <View style={{ flex: 1 }}>
          <Text variant="h2">{p.displayName}</Text>
          <Text variant="caption" tone="secondary">
            {formatCompactNumber(p.followers)} followers
          </Text>
        </View>
      </View>
      <Text variant="body" tone="secondary" style={{ marginTop: spacing.md }}>
        {p.bio}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md }}>
        {p.assetsTraded.map((a) => (
          <Badge key={a} label={a} tone="accent" />
        ))}
      </View>

      <Card style={{ marginTop: spacing.xl }}>
        <Text variant="bodyMedium">Performance</Text>
        <View style={{ marginTop: spacing.md }}>
          <EquityCurveChart data={p.equityCurve} height={140} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.lg }}>
          <StatBlock label="Net profit" value={formatPercent(p.netProfitPercent)} tone="positive" />
          <StatBlock label="Win rate" value={`${p.winRate}%`} />
          <StatBlock label="Max drawdown" value={`${p.maxDrawdownPercent}%`} tone="negative" />
          <StatBlock label="Risk score" value={`${p.riskScore} / 10`} />
        </View>
      </Card>

      <Section title="Monthly returns">
        <Card>
          <BarChart data={p.monthlyPerformance.slice(-6).map((m) => ({ label: m.month.slice(5), value: m.returnPercent }))} />
        </Card>
      </Section>

      <Section title={subscription ? 'Your allocation' : 'Copy this provider'}>
        <Card style={{ gap: spacing.md }}>
          <View style={{ backgroundColor: palette.warningMuted, borderRadius: 10, padding: spacing.md }}>
            <Text variant="caption" style={{ color: palette.warning }}>
              Copy trading carries the same risks as trading yourself. Past performance shown here is historical and
              simulated — it does not guarantee future results.
            </Text>
          </View>

          {subscription ? (
            <>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" tone="secondary">
                  Allocated
                </Text>
                <Text variant="bodyMedium">{formatCurrency(subscription.allocation)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" tone="secondary">
                  % of balance
                </Text>
                <Text variant="bodyMedium">{subscription.allocationPercent}%</Text>
              </View>
              <Button label="Stop copying" variant="danger" onPress={handleUnsubscribe} loading={isSubmitting} />
            </>
          ) : (
            <>
              <Input label="Allocation (USD)" keyboardType="decimal-pad" value={allocation} onChangeText={setAllocation} />
              <Button label="Start copying" onPress={handleSubscribe} loading={isSubmitting} />
            </>
          )}

          {actionError && (
            <Text variant="caption" tone="negative">
              {actionError}
            </Text>
          )}
        </Card>
      </Section>
    </Screen>
  );
}

function StatBlock({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <View style={{ gap: 2, minWidth: '40%' }}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="h3" tone={tone}>
        {value}
      </Text>
    </View>
  );
}
