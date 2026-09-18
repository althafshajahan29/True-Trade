import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, Pressable, View } from 'react-native';
import { NewsHeadline, SignalFactor } from '@right-trade/shared';
import { Badge, Card, ErrorState, LoadingState, Screen, ScoreBar, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { signalsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { formatRelativeTime } from '../../utils/format';
import { MoreStackParamList } from '../../navigation/types';
import { classificationLabel, classificationTone } from './classification';

type Props = NativeStackScreenProps<MoreStackParamList, 'SignalDetail'>;

export function SignalDetailScreen({ route }: Props) {
  const { symbol } = route.params;
  const { palette } = useTheme();
  const { data, isLoading, error, refetch } = useAsync(() => signalsApi.detail(symbol), [symbol]);

  if (isLoading) return <Screen><LoadingState label={`Loading ${symbol} signal…`} /></Screen>;
  if (error || !data) {
    return (
      <Screen>
        <ErrorState message={error ?? undefined} onRetry={refetch} />
      </Screen>
    );
  }

  const { score, headlines } = data;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text variant="h1">{score.symbol}</Text>
        <Badge label={classificationLabel(score.classification)} tone={classificationTone(score.classification)} />
      </View>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text variant="caption" tone="secondary">
            Composite score
          </Text>
          <Text variant="h2">{score.compositeScore > 0 ? '+' : ''}{score.compositeScore}</Text>
        </View>
        <View style={{ marginTop: spacing.md }}>
          <ScoreBar score={score.compositeScore} height={10} />
        </View>
      </Card>

      <View style={{ backgroundColor: palette.warningMuted, borderRadius: 12, padding: spacing.md, marginTop: spacing.lg }}>
        <Text variant="caption" style={{ color: palette.warning }}>
          Heuristic only — not a prediction or financial advice. Read the factors below and do your own research.
        </Text>
      </View>

      <Section title="Factors">
        <FactorCard title="Technical momentum" factor={score.technical} />
        <FactorCard title="Explosive demand" factor={score.explosiveDemand} style={{ marginTop: spacing.md }} />
        {score.newsSentiment ? (
          <FactorCard title="News sentiment" factor={score.newsSentiment} style={{ marginTop: spacing.md }} />
        ) : (
          <Card style={{ marginTop: spacing.md }}>
            <Text variant="bodyMedium">News sentiment</Text>
            <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
              {score.assetClass === 'stocks'
                ? 'No news provider configured, or no recent headlines were found — this factor was left out of the composite score rather than guessed at.'
                : 'News sentiment currently only covers stocks — there is no reliable per-symbol "company news" feed for this asset class.'}
            </Text>
          </Card>
        )}
      </Section>

      {headlines.length > 0 && (
        <Section title="Recent headlines">
          <Card padded={false}>
            {headlines.map((headline, i) => (
              <View key={headline.id}>
                <HeadlineRow headline={headline} />
                {i < headlines.length - 1 && <View style={{ height: 1, backgroundColor: palette.divider, marginHorizontal: spacing.lg }} />}
              </View>
            ))}
          </Card>
        </Section>
      )}
    </Screen>
  );
}

function FactorCard({ title, factor, style }: { title: string; factor: SignalFactor; style?: object }) {
  return (
    <Card style={style}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="bodyMedium">{title}</Text>
        <Text variant="bodyMedium" tone={factor.score > 0 ? 'positive' : factor.score < 0 ? 'negative' : 'secondary'}>
          {factor.score > 0 ? '+' : ''}
          {factor.score}
        </Text>
      </View>
      <Text variant="caption" tone="secondary" style={{ marginTop: spacing.xs }}>
        {factor.label}
      </Text>
      <Text variant="body" style={{ marginTop: spacing.sm }}>
        {factor.detail}
      </Text>
    </Card>
  );
}

function HeadlineRow({ headline }: { headline: NewsHeadline }) {
  const sentimentTone = headline.sentiment === 'positive' ? 'positive' : headline.sentiment === 'negative' ? 'negative' : 'neutral';

  return (
    <Pressable onPress={() => (headline.url ? Linking.openURL(headline.url) : undefined)}>
      <View style={{ padding: spacing.lg, gap: spacing.xs }}>
        <Text variant="body">{headline.headline}</Text>
        <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge label={headline.sentiment} tone={sentimentTone} />
          {headline.isControversy && <Badge label="controversy" tone="warning" />}
          <Text variant="caption" tone="tertiary">
            {headline.source} · {formatRelativeTime(headline.publishedAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
