import React, { useCallback, useState } from 'react';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { View } from 'react-native';
import { Badge, botStatusTone, Button, Card, ErrorState, LoadingState, Screen, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { botsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { ApiError } from '../../api/client';
import { formatCurrency, formatRelativeTime } from '../../utils/format';
import { BotsStackParamList } from '../../navigation/types';

// This screen is registered in both the Bots stack and the Dashboard stack
// (reachable from a bot shortcut on the dashboard), so it's typed loosely
// against a generic navigator rather than one specific param list.
interface Props {
  route: RouteProp<BotsStackParamList, 'BotDetail'>;
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>;
}

export function BotDetailScreen({ route, navigation }: Props) {
  const { botId } = route.params;
  const { palette } = useTheme();
  const detail = useAsync(() => botsApi.get(botId), [botId]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      detail.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const runAction = async (action: 'start' | 'pause' | 'resume' | 'stop' | 'clone') => {
    setActionLoading(action);
    setActionError(null);
    try {
      if (action === 'start') await botsApi.start(botId);
      if (action === 'pause') await botsApi.pause(botId);
      if (action === 'resume') await botsApi.resume(botId);
      if (action === 'stop') await botsApi.stop(botId);
      if (action === 'clone') {
        await botsApi.clone(botId);
        navigation.goBack();
        return;
      }
      detail.refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  if (detail.isLoading) return <Screen><LoadingState label="Loading bot…" /></Screen>;
  if (detail.error || !detail.data) {
    return (
      <Screen>
        <ErrorState message={detail.error ?? undefined} onRetry={detail.refetch} />
      </Screen>
    );
  }

  const { bot, positions, trades, signals, logs } = detail.data;
  const latestSignal = signals[0];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: spacing.xs, flex: 1 }}>
          <Text variant="h1">{bot.name}</Text>
          <Text variant="caption" tone="secondary">
            {formatCurrency(bot.allocatedCapital)} allocated · {bot.mode} mode
          </Text>
        </View>
        <Badge label={bot.status} tone={botStatusTone(bot.status)} dot />
      </View>

      {bot.lastErrorMessage && (
        <Card style={{ marginTop: spacing.md, borderColor: palette.negative }}>
          <Text variant="body" tone="negative">
            {bot.lastErrorMessage}
          </Text>
        </Card>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}>
        {bot.status === 'stopped' && <Button label="Start" fullWidth={false} onPress={() => runAction('start')} loading={actionLoading === 'start'} />}
        {bot.status === 'running' && (
          <Button label="Pause" variant="secondary" fullWidth={false} onPress={() => runAction('pause')} loading={actionLoading === 'pause'} />
        )}
        {bot.status === 'paused' && <Button label="Resume" fullWidth={false} onPress={() => runAction('resume')} loading={actionLoading === 'resume'} />}
        {(bot.status === 'running' || bot.status === 'paused') && (
          <Button label="Stop" variant="danger" fullWidth={false} onPress={() => runAction('stop')} loading={actionLoading === 'stop'} />
        )}
        <Button label="Clone" variant="secondary" fullWidth={false} onPress={() => runAction('clone')} loading={actionLoading === 'clone'} />
      </View>
      {actionError && (
        <Text variant="caption" tone="negative" style={{ marginTop: spacing.sm }}>
          {actionError}
        </Text>
      )}

      <Section title="Current signal">
        <Card>
          {latestSignal ? (
            <View style={{ gap: 4 }}>
              <Text variant="bodyMedium">{latestSignal.type.replace('_', ' ')}</Text>
              <Text variant="body" tone="secondary">
                {latestSignal.reason}
              </Text>
              <Text variant="caption" tone="tertiary">
                {formatRelativeTime(latestSignal.createdAt)} @ {latestSignal.price}
              </Text>
            </View>
          ) : (
            <Text variant="body" tone="secondary">
              No signals yet — the bot evaluates the strategy on each tick.
            </Text>
          )}
        </Card>
      </Section>

      <Section title="Open positions">
        {positions.length === 0 ? (
          <Card>
            <Text variant="body" tone="secondary">
              No open positions.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {positions.map((pos) => (
              <Card key={pos.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ gap: 2 }}>
                  <Text variant="bodyMedium">
                    {pos.symbol} · {pos.direction}
                  </Text>
                  <Text variant="caption" tone="secondary">
                    Entry {pos.entryPrice} · Now {pos.currentPrice}
                  </Text>
                </View>
                <Text variant="bodyMedium" tone={pos.unrealizedPnl >= 0 ? 'positive' : 'negative'}>
                  {pos.unrealizedPnl >= 0 ? '+' : ''}
                  {formatCurrency(pos.unrealizedPnl)}
                </Text>
              </Card>
            ))}
          </View>
        )}
      </Section>

      <Section title="Recent trades">
        {trades.length === 0 ? (
          <Card>
            <Text variant="body" tone="secondary">
              No trades yet.
            </Text>
          </Card>
        ) : (
          <Card padded={false}>
            {trades.slice(0, 10).map((trade, i) => (
              <View key={trade.id}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg }}>
                  <View style={{ gap: 2 }}>
                    <Text variant="body">
                      {trade.symbol} · {trade.direction}
                    </Text>
                    <Text variant="caption" tone="secondary">
                      {formatRelativeTime(trade.openedAt)}
                    </Text>
                  </View>
                  {trade.status === 'open' ? (
                    <Badge label="open" tone="accent" />
                  ) : (
                    <Text variant="bodyMedium" tone={(trade.pnl ?? 0) >= 0 ? 'positive' : 'negative'}>
                      {(trade.pnl ?? 0) >= 0 ? '+' : ''}
                      {formatCurrency(trade.pnl ?? 0)}
                    </Text>
                  )}
                </View>
                {i < trades.length - 1 && <View style={{ height: 1, backgroundColor: palette.divider, marginHorizontal: spacing.lg }} />}
              </View>
            ))}
          </Card>
        )}
      </Section>

      <Section title="Logs">
        <Card padded={false}>
          {logs.length === 0 ? (
            <View style={{ padding: spacing.lg }}>
              <Text variant="body" tone="secondary">
                No logs yet.
              </Text>
            </View>
          ) : (
            logs.slice(0, 20).map((log, i) => (
              <View key={log.id} style={{ padding: spacing.lg, paddingVertical: spacing.sm }}>
                <Text
                  variant="caption"
                  tone={log.level === 'error' ? 'negative' : log.level === 'warning' ? 'warning' : 'secondary'}
                >
                  {formatRelativeTime(log.createdAt)} · {log.message}
                </Text>
              </View>
            ))
          )}
        </Card>
      </Section>
    </Screen>
  );
}
