import React, { useEffect, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, View } from 'react-native';
import { BacktestResult, BacktestRun, Strategy } from '@right-trade/shared';
import { Badge, Button, Card, Input, LoadingState, PillTabs, Screen, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { strategiesApi, backtestsApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { StrategiesStackParamList } from '../../navigation/types';
import { BacktestResultView } from './BacktestResultView';
import { formatCurrency } from '../../utils/format';

type Props = NativeStackScreenProps<StrategiesStackParamList, 'BacktestLab'>;

const RANGE_PRESETS = [
  { value: '7d', label: '7 days', days: 7 },
  { value: '30d', label: '30 days', days: 30 },
  { value: '90d', label: '90 days', days: 90 },
  { value: '180d', label: '180 days', days: 180 },
];

export function BacktestLabScreen({ route }: Props) {
  const { strategyId } = route.params;
  const { palette } = useTheme();

  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [isLoadingStrategy, setIsLoadingStrategy] = useState(true);
  const [rangePreset, setRangePreset] = useState('30d');
  const [initialBalance, setInitialBalance] = useState('10000');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [pastRuns, setPastRuns] = useState<BacktestRun[]>([]);

  useEffect(() => {
    strategiesApi
      .get(strategyId)
      .then(setStrategy)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load strategy.'))
      .finally(() => setIsLoadingStrategy(false));

    backtestsApi
      .list()
      .then((runs) => setPastRuns(runs.filter((r) => r.strategyId === strategyId).slice(0, 5)))
      .catch(() => undefined);
  }, [strategyId]);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const preset = RANGE_PRESETS.find((p) => p.value === rangePreset) ?? RANGE_PRESETS[1]!;
      const end = new Date();
      const start = new Date(end.getTime() - preset.days * 86_400_000);
      const { run, result: backtestResult } = await backtestsApi.run({
        strategyId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        initialBalance: Number(initialBalance) || 10000,
      });
      setResult(backtestResult);
      setPastRuns((prev) => [run, ...prev].slice(0, 5));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Backtest failed to run.');
    } finally {
      setIsRunning(false);
    }
  };

  const openPastRun = async (runId: string) => {
    setError(null);
    try {
      const { result: r } = await backtestsApi.get(runId);
      if (r) setResult(r);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load that run.');
    }
  };

  if (isLoadingStrategy) return <Screen><LoadingState label="Loading strategy…" /></Screen>;

  return (
    <Screen>
      <Text variant="h1">Backtesting Lab</Text>
      {strategy && (
        <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
          {strategy.name} · {strategy.symbol} · {strategy.timeframe}
        </Text>
      )}

      <Section title="Date range">
        <PillTabs options={RANGE_PRESETS} value={rangePreset} onChange={setRangePreset} scrollable={false} />
        <Input
          label="Initial balance"
          keyboardType="decimal-pad"
          value={initialBalance}
          onChangeText={setInitialBalance}
          containerStyle={{ marginTop: spacing.md }}
          suffix="USD"
        />
        <Button label="Run backtest" onPress={handleRun} loading={isRunning} style={{ marginTop: spacing.lg }} />
      </Section>

      {error && (
        <Card style={{ marginTop: spacing.lg, borderColor: palette.negative }}>
          <Text variant="body" tone="negative">
            {error}
          </Text>
        </Card>
      )}

      {result && (
        <View style={{ marginTop: spacing.xl }}>
          <BacktestResultView result={result} />
        </View>
      )}

      {pastRuns.length > 0 && (
        <Section title="Compare runs">
          <View style={{ gap: spacing.sm }}>
            {pastRuns.map((run) => (
              <Pressable key={run.id} onPress={() => openPastRun(run.id)}>
                <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text variant="body">
                      {new Date(run.startDate).toLocaleDateString()} – {new Date(run.endDate).toLocaleDateString()}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {formatCurrency(run.initialBalance)} initial balance
                    </Text>
                  </View>
                  <Badge label={run.status} tone={run.status === 'completed' ? 'positive' : run.status === 'failed' ? 'negative' : 'accent'} />
                </Card>
              </Pressable>
            ))}
          </View>
        </Section>
      )}

      <Section title="Parameter optimization">
        <Card>
          <Text variant="body" tone="secondary">
            Automatic parameter sweeps (grid search across stop loss, take profit, and indicator periods) are coming
            in a future release. For now, tune your strategy's rules manually and re-run backtests to compare.
          </Text>
        </Card>
      </Section>
    </Screen>
  );
}
