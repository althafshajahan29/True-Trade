import React from 'react';
import { View } from 'react-native';
import { BacktestResult } from '@right-trade/shared';
import { Card, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { EquityCurveChart } from '../../components/charts/EquityCurveChart';
import { formatCurrency, formatDateTime, formatPercent } from '../../utils/format';

function MetricTile({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <View style={{ flex: 1, minWidth: '30%', gap: 2 }}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="bodyMedium" tone={tone}>
        {value}
      </Text>
    </View>
  );
}

export function BacktestResultView({ result }: { result: BacktestResult }) {
  const { palette } = useTheme();
  const m = result.metrics;

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Text variant="bodyMedium">Equity curve</Text>
        <View style={{ marginTop: spacing.md }}>
          <EquityCurveChart data={result.equityCurve} />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg }}>
          <MetricTile label="Net profit" value={formatCurrency(m.netProfit)} tone={m.netProfit >= 0 ? 'positive' : 'negative'} />
          <MetricTile label="Net profit %" value={formatPercent(m.netProfitPercent)} tone={m.netProfitPercent >= 0 ? 'positive' : 'negative'} />
          <MetricTile label="Win rate" value={`${m.winRate}%`} />
          <MetricTile label="Profit factor" value={m.profitFactor.toFixed(2)} />
          <MetricTile label="Max drawdown" value={`${formatCurrency(m.maxDrawdown)} (${m.maxDrawdownPercent}%)`} tone="negative" />
          <MetricTile label="Sharpe ratio" value={m.sharpeRatio.toFixed(2)} />
          <MetricTile label="Total trades" value={String(m.totalTrades)} />
          <MetricTile label="Avg trade" value={formatCurrency(m.averageTrade)} />
        </View>
      </Card>

      <View>
        <Text variant="bodyMedium" style={{ marginBottom: spacing.md }}>
          Trade list ({result.trades.length})
        </Text>
        {result.trades.length === 0 ? (
          <Card>
            <Text variant="body" tone="secondary">
              No trades were triggered in this date range.
            </Text>
          </Card>
        ) : (
          <Card padded={false}>
            {result.trades.map((trade, i) => (
              <View key={trade.id}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: spacing.lg,
                  }}
                >
                  <View style={{ gap: 2 }}>
                    <Text variant="bodyMedium">{trade.direction === 'long' ? 'Long' : 'Short'}</Text>
                    <Text variant="caption" tone="secondary">
                      {formatDateTime(trade.entryTime)} → {formatDateTime(trade.exitTime)}
                    </Text>
                    <Text variant="caption" tone="tertiary">
                      {trade.entryPrice} → {trade.exitPrice} · {trade.exitReason.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text variant="bodyMedium" tone={trade.pnl >= 0 ? 'positive' : 'negative'}>
                    {trade.pnl >= 0 ? '+' : ''}
                    {formatCurrency(trade.pnl)}
                  </Text>
                </View>
                {i < result.trades.length - 1 && <View style={{ height: 1, backgroundColor: palette.divider, marginHorizontal: spacing.lg }} />}
              </View>
            ))}
          </Card>
        )}
      </View>
    </View>
  );
}
