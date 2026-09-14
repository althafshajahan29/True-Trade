import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, View } from 'react-native';
import { Alert, AlertSeverity } from '@right-trade/shared';
import { Badge, BadgeTone, Card, EmptyState, ErrorState, LoadingState, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { alertsApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { formatRelativeTime } from '../../utils/format';

function severityTone(severity: AlertSeverity): BadgeTone {
  if (severity === 'critical') return 'negative';
  if (severity === 'warning') return 'warning';
  return 'accent';
}

export function AlertsScreen() {
  const { palette } = useTheme();
  const alerts = useAsync(() => alertsApi.list(), []);

  useFocusEffect(
    useCallback(() => {
      alerts.refetch();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const handleMarkAllRead = async () => {
    await alertsApi.markAllRead();
    alerts.refetch();
  };

  const handlePress = async (alert: Alert) => {
    if (!alert.read) {
      await alertsApi.markRead(alert.id);
      alerts.refetch();
    }
  };

  const items = alerts.data?.items ?? [];

  return (
    <Screen refreshing={alerts.isRefreshing} onRefresh={alerts.refresh}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="h1">Alerts</Text>
        {items.some((a) => !a.read) && (
          <Pressable onPress={handleMarkAllRead}>
            <Text variant="caption" style={{ color: palette.accent }}>
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {alerts.isLoading ? (
          <LoadingState />
        ) : alerts.error ? (
          <ErrorState message={alerts.error} onRetry={alerts.refetch} />
        ) : items.length === 0 ? (
          <EmptyState title="No alerts" message="Price, risk, bot, and trade execution alerts will show up here." />
        ) : (
          items.map((alert) => (
            <Pressable key={alert.id} onPress={() => handlePress(alert)}>
              <Card style={{ opacity: alert.read ? 0.6 : 1, gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text variant="bodyMedium" style={{ flex: 1 }}>
                    {alert.title}
                  </Text>
                  <Badge label={alert.type.replace('_', ' ')} tone={severityTone(alert.severity)} />
                </View>
                <Text variant="body" tone="secondary">
                  {alert.message}
                </Text>
                <Text variant="caption" tone="tertiary">
                  {formatRelativeTime(alert.createdAt)}
                </Text>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </Screen>
  );
}
