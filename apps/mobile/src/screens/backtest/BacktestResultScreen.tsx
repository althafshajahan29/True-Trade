import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorState, LoadingState, Screen, Text } from '../../components/ui';
import { backtestsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { StrategiesStackParamList } from '../../navigation/types';
import { BacktestResultView } from './BacktestResultView';
import { spacing } from '../../theme/tokens';

type Props = NativeStackScreenProps<StrategiesStackParamList, 'BacktestResult'>;

export function BacktestResultScreen({ route }: Props) {
  const { backtestId } = route.params;
  const { data, isLoading, error, refetch } = useAsync(() => backtestsApi.get(backtestId), [backtestId]);

  if (isLoading) return <Screen><LoadingState label="Loading results…" /></Screen>;
  if (error || !data?.result) {
    return (
      <Screen>
        <ErrorState message={error ?? 'This backtest has no results yet.'} onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Text variant="h1" style={{ marginBottom: spacing.lg }}>
        Backtest results
      </Text>
      <BacktestResultView result={data.result} />
    </Screen>
  );
}
