import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View } from 'react-native';
import { Card, ErrorState, LoadingState, Screen, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { analyticsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { EquityCurveChart } from '../../components/charts/EquityCurveChart';
import { BarChart } from '../../components/charts/BarChart';
import { formatPercent } from '../../utils/format';

export function AnalyticsScreen() {
  const overview = useAsync(() => analyticsApi.overview(), []);
  const performance = useAsync(() => analyticsApi.performance(), []);

  useFocusEffect(
    useCallback(() => {
      overview.refetch();
      performance.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  if (overview.isLoading || performance.isLoading) return <Screen><LoadingState label="Crunching numbers…" /></Screen>;
  if (overview.error || performance.error || !overview.data || !performance.data) {
    return (
      <Screen>
        <ErrorState
          message={overview.error ?? performance.error ?? undefined}
          onRetry={() => {
            overview.refetch();
            performance.refetch();
          }}
        />
      </Screen>
    );
  }

  const o = overview.data;
  const p = performance.data;

  return (
    <Screen refreshing={overview.isRefreshing} onRefresh={overview.refresh}>
      <Text variant="h1">Analytics</Text>

      <Card style={{ marginTop: spacing.lg }}>
        <Text variant="bodyMedium">Portfolio summary</Text>
        <View style={{ marginTop: spacing.md }}>
          <EquityCurveChart data={o.equityCurve} height={140} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.lg }}>
          <Metric label="Total return" value={formatPercent(p.totalReturnPercent)} tone={p.totalReturnPercent >= 0 ? 'positive' : 'negative'} />
          <Metric label="Win rate" value={`${p.winRate}%`} />
          <Metric label="Profit factor" value={p.profitFactor.toFixed(2)} />
          <Metric label="Max drawdown" value={`${p.maxDrawdownPercent}%`} tone="negative" />
          <Metric label="Sharpe ratio" value={p.sharpeRatio.toFixed(2)} />
        </View>
      </Card>

      <Section title="Bot comparison">
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Card style={{ flex: 1 }}>
            <Text variant="caption" tone="secondary">
              Best bot
            </Text>
            {p.bestBot ? (
              <>
                <Text variant="bodyMedium" style={{ marginTop: spacing.xs }}>
                  {p.bestBot.name}
                </Text>
                <Text variant="body" tone="positive">
                  {formatPercent(p.bestBot.returnPercent)}
                </Text>
              </>
            ) : (
              <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
                No data yet
              </Text>
            )}
          </Card>
          <Card style={{ flex: 1 }}>
            <Text variant="caption" tone="secondary">
              Worst bot
            </Text>
            {p.worstBot ? (
              <>
                <Text variant="bodyMedium" style={{ marginTop: spacing.xs }}>
                  {p.worstBot.name}
                </Text>
                <Text variant="body" tone="negative">
                  {formatPercent(p.worstBot.returnPercent)}
                </Text>
              </>
            ) : (
              <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
                No data yet
              </Text>
            )}
          </Card>
        </View>
      </Section>

      <Section title="Monthly performance">
        <Card>
          {p.monthlyReturns.length === 0 ? (
            <Text variant="body" tone="secondary">
              Not enough closed trades yet to show monthly performance.
            </Text>
          ) : (
            <BarChart data={p.monthlyReturns.slice(-6).map((m) => ({ label: m.month.slice(5), value: m.returnPercent }))} />
          )}
        </Card>
      </Section>

      <Section title="Trade distribution">
        <Card>
          {p.tradeDistribution.every((b) => b.count === 0) ? (
            <Text variant="body" tone="secondary">
              No closed trades yet.
            </Text>
          ) : (
            <BarChart data={p.tradeDistribution.map((b) => ({ label: b.bucket, value: b.count }))} />
          )}
        </Card>
      </Section>
    </Screen>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
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
