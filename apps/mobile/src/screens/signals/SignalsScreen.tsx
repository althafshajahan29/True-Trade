import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, View } from 'react-native';
import { ExplosiveCandidate, SignalScore } from '@right-trade/shared';
import { Badge, Card, EmptyState, ErrorState, LoadingState, Screen, ScoreBar, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { signalsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { MoreStackParamList } from '../../navigation/types';
import { classificationLabel, classificationTone } from './classification';

type Props = NativeStackScreenProps<MoreStackParamList, 'Signals'>;

export function SignalsScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const signals = useAsync(() => signalsApi.list(), []);
  const explosive = useAsync(() => signalsApi.explosive(5), []);

  useFocusEffect(
    useCallback(() => {
      signals.refetch();
      explosive.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const isRefreshing = signals.isRefreshing || explosive.isRefreshing;
  const refreshAll = () => {
    signals.refresh();
    explosive.refresh();
  };

  return (
    <Screen refreshing={isRefreshing} onRefresh={refreshAll}>
      <Text variant="h1">Market Intelligence</Text>
      <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
        A blend of technical momentum, unusual activity, and (when available) news sentiment.
      </Text>

      <View style={{ backgroundColor: palette.warningMuted, borderRadius: 12, padding: spacing.md, marginTop: spacing.lg }}>
        <Text variant="caption" style={{ color: palette.warning }}>
          Educational signal only — not financial advice. This does not predict future prices; it summarizes current
          momentum, unusual volume/price activity, and recent headlines so you can research further.
        </Text>
      </View>

      <Section title="Explosive demand">
        {explosive.isLoading ? (
          <LoadingState label="Scanning for unusual activity…" />
        ) : explosive.error ? (
          <ErrorState message={explosive.error} onRetry={explosive.refetch} />
        ) : (explosive.data ?? []).length === 0 || (explosive.data ?? []).every((c) => c.explosiveScore < 5) ? (
          <EmptyState title="Nothing unusual right now" message="No symbols are showing abnormal volume, price, or volatility activity." />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {(explosive.data ?? [])
              .filter((c) => c.explosiveScore >= 5)
              .map((candidate) => (
                <ExplosiveRow key={candidate.symbol} candidate={candidate} onPress={() => navigation.navigate('SignalDetail', { symbol: candidate.symbol })} />
              ))}
          </View>
        )}
      </Section>

      <Section title="All symbols">
        {signals.isLoading ? (
          <LoadingState label="Computing signal scores…" />
        ) : signals.error ? (
          <ErrorState message={signals.error} onRetry={signals.refetch} />
        ) : (signals.data ?? []).length === 0 ? (
          <EmptyState title="No signals yet" message="Scores are computed on a background refresh — check back in a moment." />
        ) : (
          <Card padded={false}>
            {(signals.data ?? []).map((score, i) => (
              <View key={score.symbol}>
                <SignalRow score={score} onPress={() => navigation.navigate('SignalDetail', { symbol: score.symbol })} />
                {i < (signals.data ?? []).length - 1 && (
                  <View style={{ height: 1, backgroundColor: palette.divider, marginHorizontal: spacing.lg }} />
                )}
              </View>
            ))}
          </Card>
        )}
      </Section>
    </Screen>
  );
}

function ExplosiveRow({ candidate, onPress }: { candidate: ExplosiveCandidate; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="bodyMedium">{candidate.symbol}</Text>
          <Badge label={`${candidate.explosiveScore.toFixed(0)} / 100`} tone={candidate.priceChangePercent >= 0 ? 'positive' : 'negative'} />
        </View>
        <Text variant="caption" tone="secondary" style={{ marginTop: spacing.xs }}>
          {candidate.reason}
        </Text>
      </Card>
    </Pressable>
  );
}

function SignalRow({ score, onPress }: { score: SignalScore; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="bodyMedium">{score.symbol}</Text>
          <Badge label={classificationLabel(score.classification)} tone={classificationTone(score.classification)} />
        </View>
        <ScoreBar score={score.compositeScore} />
      </View>
    </Pressable>
  );
}
