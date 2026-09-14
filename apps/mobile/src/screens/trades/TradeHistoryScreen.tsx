import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View } from 'react-native';
import { Badge, Card, EmptyState, ErrorState, LoadingState, PillTabs, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { tradesApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { formatCurrency, formatDateTime } from '../../utils/format';

const FILTERS: { value: 'all' | 'open' | 'closed'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
];

export function TradeHistoryScreen() {
  const { palette } = useTheme();
  const trades = useAsync(() => tradesApi.list(), []);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  useFocusEffect(
    useCallback(() => {
      trades.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const filtered = useMemo(
    () => (trades.data ?? []).filter((t) => filter === 'all' || t.status === filter),
    [trades.data, filter],
  );

  return (
    <Screen refreshing={trades.isRefreshing} onRefresh={trades.refresh}>
      <Text variant="h1">Trade History</Text>
      <View style={{ marginTop: spacing.lg }}>
        <PillTabs options={FILTERS} value={filter} onChange={setFilter} scrollable={false} />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        {trades.isLoading ? (
          <LoadingState />
        ) : trades.error ? (
          <ErrorState message={trades.error} onRetry={trades.refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No trades" message="Trades will appear here once your bots or copy subscriptions execute." />
        ) : (
          <Card padded={false}>
            {filtered.map((trade, i) => (
              <View key={trade.id}>
                <View style={{ padding: spacing.lg, gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text variant="bodyMedium">
                      {trade.symbol} · {trade.direction === 'long' ? 'Long' : 'Short'}
                    </Text>
                    {trade.status === 'open' ? (
                      <Badge label="open" tone="accent" />
                    ) : (
                      <Text variant="bodyMedium" tone={(trade.pnl ?? 0) >= 0 ? 'positive' : 'negative'}>
                        {(trade.pnl ?? 0) >= 0 ? '+' : ''}
                        {formatCurrency(trade.pnl ?? 0)}
                      </Text>
                    )}
                  </View>
                  <Text variant="caption" tone="secondary">
                    {trade.source} · entry {trade.entryPrice}
                    {trade.exitPrice ? ` → exit ${trade.exitPrice}` : ''}
                  </Text>
                  <Text variant="caption" tone="tertiary">
                    Opened {formatDateTime(trade.openedAt)}
                    {trade.closedAt ? ` · Closed ${formatDateTime(trade.closedAt)}` : ''}
                  </Text>
                </View>
                {i < filtered.length - 1 && <View style={{ height: 1, backgroundColor: palette.divider, marginHorizontal: spacing.lg }} />}
              </View>
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}
