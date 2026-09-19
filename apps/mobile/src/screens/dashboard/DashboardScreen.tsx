import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, View } from 'react-native';
import { average, Bot, NewsHeadline, SignalScore, Trade } from '@right-trade/shared';
import { EquityCurveChart } from '../../components/charts/EquityCurveChart';
import { Avatar, Badge, botStatusTone, Card, EmptyState, ErrorState, LoadingState, MarketPulseGauge, Screen, ScoreBar, Section, StatGrid, StatTile, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { analyticsApi, botsApi, signalsApi, tradesApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { formatCurrency, formatPercent, formatRelativeTime } from '../../utils/format';
import { DashboardStackParamList } from '../../navigation/types';
import { classificationLabel, classificationTone } from '../signals/classification';

type Props = NativeStackScreenProps<DashboardStackParamList, 'Dashboard'>;

export function DashboardScreen({ navigation }: Props) {
  const { palette } = useTheme();
  const user = useAuthStore((s) => s.user);

  const overview = useAsync(() => analyticsApi.overview(), []);
  const bots = useAsync(() => botsApi.list(), []);
  const trades = useAsync(() => tradesApi.list(), []);
  const signals = useAsync(() => signalsApi.list(), []);
  const news = useAsync(() => signalsApi.news(4), []);

  useFocusEffect(
    useCallback(() => {
      overview.refetch();
      bots.refetch();
      trades.refetch();
      signals.refetch();
      news.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const isRefreshing = overview.isRefreshing || bots.isRefreshing || trades.isRefreshing;
  const refreshAll = () => {
    overview.refresh();
    bots.refresh();
    trades.refresh();
    signals.refresh();
    news.refresh();
  };

  if (overview.isLoading) return <Screen><LoadingState label="Loading your dashboard…" /></Screen>;
  if (overview.error || !overview.data) {
    return (
      <Screen>
        <ErrorState message={overview.error ?? undefined} onRetry={overview.refetch} />
      </Screen>
    );
  }

  const data = overview.data;
  const runningBots = (bots.data ?? []).filter((b) => b.status === 'running');
  const recentTrades = (trades.data ?? []).slice(0, 5);

  return (
    <Screen refreshing={isRefreshing} onRefresh={refreshAll}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text variant="caption" tone="secondary">
            Welcome back
          </Text>
          <Text variant="h1">{user?.displayName ?? 'Trader'}</Text>
        </View>
        {user && <Avatar name={user.displayName} color={user.avatarColor} />}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <StatGrid>
          <StatTile label="Equity" value={formatCurrency(data.equity)} />
          <StatTile label="Balance" value={formatCurrency(data.balance)} />
          <StatTile
            label="Unrealized P/L"
            value={formatCurrency(data.unrealizedPnl)}
            delta={formatPercent(data.unrealizedPnlPercent)}
            deltaTone={data.unrealizedPnl >= 0 ? 'positive' : 'negative'}
          />
          <StatTile
            label="Today's P/L"
            value={formatCurrency(data.realizedPnlToday)}
            delta={formatPercent(data.realizedPnlTodayPercent)}
            deltaTone={data.realizedPnlToday >= 0 ? 'positive' : 'negative'}
          />
        </StatGrid>
      </View>

      <Card style={{ marginTop: spacing.xl }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="bodyMedium">Equity curve</Text>
          <Badge label={`${data.activeBotCount} active bot${data.activeBotCount === 1 ? '' : 's'}`} tone="accent" />
        </View>
        <View style={{ marginTop: spacing.md }}>
          <EquityCurveChart data={data.equityCurve} />
        </View>
      </Card>

      <Section
        title="Market pulse"
        actionLabel="View all"
        onAction={() => (navigation.getParent()?.navigate as (...args: unknown[]) => void)?.('SignalsTab')}
      >
        {signals.isLoading ? (
          <LoadingState label="Computing signal scores…" />
        ) : (signals.data ?? []).length === 0 ? (
          <EmptyState title="No signals yet" message="Market Intelligence scores refresh in the background." />
        ) : (
          <View style={{ gap: spacing.lg }}>
            <Card>
              <MarketPulseGauge score={average((signals.data ?? []).map((s) => s.compositeScore))} label={`Across ${(signals.data ?? []).length} tracked symbols`} />
            </Card>
            {(signals.data ?? []).slice(0, 3).map((score) => (
              <SignalPulseRow
                key={score.symbol}
                score={score}
                onPress={() =>
                  (navigation.getParent()?.navigate as (...args: unknown[]) => void)?.('SignalsTab', {
                    screen: 'SignalDetail',
                    params: { symbol: score.symbol },
                  })
                }
              />
            ))}
          </View>
        )}
      </Section>

      <Section
        title="Latest headlines"
        actionLabel="View all"
        onAction={() => (navigation.getParent()?.navigate as (...args: unknown[]) => void)?.('SignalsTab')}
      >
        {news.isLoading ? (
          <LoadingState label="Fetching recent headlines…" />
        ) : (news.data ?? []).length === 0 ? (
          <EmptyState
            title="No headlines yet"
            message="Set a FINNHUB_API_KEY on the server to pull in real news headlines — without one, this feed stays empty rather than showing anything fake."
          />
        ) : (
          <Card padded={false}>
            {(news.data ?? []).slice(0, 4).map((headline, i, arr) => (
              <View key={headline.id}>
                <HeadlineTeaserRow
                  headline={headline}
                  onPress={() =>
                    (navigation.getParent()?.navigate as (...args: unknown[]) => void)?.('SignalsTab', {
                      screen: 'SignalDetail',
                      params: { symbol: headline.symbol },
                    })
                  }
                />
                {i < arr.length - 1 && <View style={{ height: 1, backgroundColor: palette.divider, marginHorizontal: spacing.lg }} />}
              </View>
            ))}
          </Card>
        )}
      </Section>

      <Section title="Top bots" actionLabel="View all" onAction={() => navigation.getParent()?.navigate('BotsTab' as never)}>
        {bots.isLoading ? (
          <LoadingState label="Loading bots…" />
        ) : runningBots.length === 0 ? (
          <EmptyState title="No bots running" message="Start a bot from a strategy to see it here." />
        ) : (
          <View style={{ gap: spacing.sm }}>
            {runningBots.slice(0, 3).map((bot) => (
              <BotRow key={bot.id} bot={bot} onPress={() => navigation.navigate('BotDetail', { botId: bot.id })} />
            ))}
          </View>
        )}
      </Section>

      <Section title="Alerts" actionLabel="View all" onAction={() => navigation.navigate('Alerts')}>
        {data.unreadAlertCount === 0 ? (
          <Card>
            <Text variant="body" tone="secondary">
              You're all caught up — no unread alerts.
            </Text>
          </Card>
        ) : (
          <Card>
            <Text variant="body">
              You have <Text variant="bodyMedium" tone="warning">{data.unreadAlertCount} unread alert{data.unreadAlertCount === 1 ? '' : 's'}</Text>.
            </Text>
          </Card>
        )}
      </Section>

      <Section title="Recent trades" actionLabel="View all" onAction={() => navigation.navigate('TradeHistory')}>
        {trades.isLoading ? (
          <LoadingState label="Loading trades…" />
        ) : recentTrades.length === 0 ? (
          <EmptyState title="No trades yet" message="Trades from your bots and copy subscriptions will show up here." />
        ) : (
          <Card padded={false}>
            {recentTrades.map((trade, i) => (
              <View key={trade.id}>
                <TradeRow trade={trade} />
                {i < recentTrades.length - 1 && <View style={{ height: 1, backgroundColor: palette.divider, marginHorizontal: spacing.lg }} />}
              </View>
            ))}
          </Card>
        )}
      </Section>
    </Screen>
  );
}

function BotRow({ bot, onPress }: { bot: Bot; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ gap: 2 }}>
          <Text variant="bodyMedium">{bot.name}</Text>
          <Text variant="caption" tone="secondary">
            {formatCurrency(bot.allocatedCapital)} allocated
          </Text>
        </View>
        <Badge label={bot.status} tone={botStatusTone(bot.status)} dot />
      </Card>
    </Pressable>
  );
}

function SignalPulseRow({ score, onPress }: { score: SignalScore; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="bodyMedium">{score.symbol}</Text>
          <Badge label={classificationLabel(score.classification)} tone={classificationTone(score.classification)} />
        </View>
        <ScoreBar score={score.compositeScore} height={6} />
      </Card>
    </Pressable>
  );
}

function HeadlineTeaserRow({ headline, onPress }: { headline: NewsHeadline; onPress: () => void }) {
  const sentimentTone = headline.sentiment === 'positive' ? 'positive' : headline.sentiment === 'negative' ? 'negative' : 'neutral';
  return (
    <Pressable onPress={onPress}>
      <View style={{ padding: spacing.lg, gap: spacing.xs }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="caption" tone="secondary">
            {headline.symbol}
          </Text>
          <Badge label={headline.sentiment} tone={sentimentTone} />
        </View>
        <Text variant="body">{headline.headline}</Text>
        <Text variant="caption" tone="tertiary">
          {headline.source} · {formatRelativeTime(headline.publishedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const isOpen = trade.status === 'open';
  const pnl = trade.pnl ?? 0;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg }}>
      <View style={{ gap: 2 }}>
        <Text variant="bodyMedium">
          {trade.symbol} · {trade.direction === 'long' ? 'Long' : 'Short'}
        </Text>
        <Text variant="caption" tone="secondary">
          {formatRelativeTime(trade.openedAt)} · {trade.source}
        </Text>
      </View>
      {isOpen ? (
        <Badge label="open" tone="accent" />
      ) : (
        <Text variant="bodyMedium" tone={pnl >= 0 ? 'positive' : 'negative'}>
          {pnl >= 0 ? '+' : ''}
          {formatCurrency(pnl)}
        </Text>
      )}
    </View>
  );
}
