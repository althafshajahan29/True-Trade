import React, { useCallback, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, View } from 'react-native';
import { Bot } from '@right-trade/shared';
import { Badge, botStatusTone, Card, EmptyState, ErrorState, LoadingState, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { botsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { formatCurrency } from '../../utils/format';
import { BotsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<BotsStackParamList, 'BotMonitor'>;

export function BotMonitorScreen({ navigation }: Props) {
  const bots = useAsync(() => botsApi.list(), []);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      bots.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleQuickAction = async (bot: Bot, action: 'start' | 'pause' | 'resume' | 'stop') => {
    setActioningId(bot.id);
    try {
      if (action === 'start') await botsApi.start(bot.id);
      if (action === 'pause') await botsApi.pause(bot.id);
      if (action === 'resume') await botsApi.resume(bot.id);
      if (action === 'stop') await botsApi.stop(bot.id);
      bots.refetch();
    } finally {
      setActioningId(null);
    }
  };

  return (
    <Screen refreshing={bots.isRefreshing} onRefresh={bots.refresh}>
      <Text variant="h1">Bot Monitor</Text>
      <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
        Manage every bot running against your strategies.
      </Text>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {bots.isLoading ? (
          <LoadingState />
        ) : bots.error ? (
          <ErrorState message={bots.error} onRetry={bots.refetch} />
        ) : (bots.data ?? []).length === 0 ? (
          <EmptyState
            title="No bots yet"
            message="Create a strategy, then turn it into a bot to start paper trading automatically."
          />
        ) : (
          (bots.data ?? []).map((bot) => (
            <Pressable key={bot.id} onPress={() => navigation.navigate('BotDetail', { botId: bot.id })}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ gap: 2, flex: 1 }}>
                    <Text variant="bodyMedium">{bot.name}</Text>
                    <Text variant="caption" tone="secondary">
                      {formatCurrency(bot.allocatedCapital)} allocated · {bot.mode}
                    </Text>
                  </View>
                  <Badge label={bot.status} tone={botStatusTone(bot.status)} dot />
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  {bot.status === 'stopped' && (
                    <QuickAction label="Start" onPress={() => handleQuickAction(bot, 'start')} loading={actioningId === bot.id} />
                  )}
                  {bot.status === 'running' && (
                    <QuickAction label="Pause" onPress={() => handleQuickAction(bot, 'pause')} loading={actioningId === bot.id} />
                  )}
                  {bot.status === 'paused' && (
                    <QuickAction label="Resume" onPress={() => handleQuickAction(bot, 'resume')} loading={actioningId === bot.id} />
                  )}
                  {(bot.status === 'running' || bot.status === 'paused') && (
                    <QuickAction label="Stop" onPress={() => handleQuickAction(bot, 'stop')} loading={actioningId === bot.id} tone="negative" />
                  )}
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}

function QuickAction({
  label,
  onPress,
  loading,
  tone,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  tone?: 'negative';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={{ paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' }}
    >
      <Text variant="caption" tone={tone ?? 'accent'}>
        {loading ? '…' : label}
      </Text>
    </Pressable>
  );
}
