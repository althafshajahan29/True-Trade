import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, View } from 'react-native';
import { Strategy } from '@right-trade/shared';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { strategiesApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { StrategiesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<StrategiesStackParamList, 'StrategyList'>;

function statusTone(status: Strategy['status']) {
  if (status === 'active') return 'positive' as const;
  if (status === 'archived') return 'neutral' as const;
  return 'accent' as const;
}

export function StrategyListScreen({ navigation }: Props) {
  const strategies = useAsync(() => strategiesApi.list(), []);

  useFocusEffect(
    useCallback(() => {
      strategies.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  return (
    <Screen refreshing={strategies.isRefreshing} onRefresh={strategies.refresh}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="h1">Strategies</Text>
      </View>
      <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
        Build a rule-based strategy, then backtest or run it as a bot.
      </Text>

      <Button
        label="New strategy"
        onPress={() => navigation.navigate('StrategyBuilder', {})}
        style={{ marginTop: spacing.lg }}
      />

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {strategies.isLoading ? (
          <LoadingState />
        ) : strategies.error ? (
          <ErrorState message={strategies.error} onRetry={strategies.refetch} />
        ) : (strategies.data ?? []).length === 0 ? (
          <EmptyState
            title="No strategies yet"
            message="Create your first rule-based strategy to start backtesting."
            actionLabel="Create strategy"
            onAction={() => navigation.navigate('StrategyBuilder', {})}
          />
        ) : (
          (strategies.data ?? []).map((strategy) => (
            <Pressable key={strategy.id} onPress={() => navigation.navigate('StrategyBuilder', { strategyId: strategy.id })}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyMedium">{strategy.name}</Text>
                    <Text variant="caption" tone="secondary">
                      {strategy.symbol} · {strategy.timeframe} · {strategy.direction}
                    </Text>
                  </View>
                  <Badge label={strategy.status} tone={statusTone(strategy.status)} />
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button
                    label="Backtest"
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    onPress={() => navigation.navigate('BacktestLab', { strategyId: strategy.id })}
                  />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
