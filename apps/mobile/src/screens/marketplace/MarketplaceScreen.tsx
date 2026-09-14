import React, { useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, View } from 'react-native';
import { AssetClass, ProviderProfile } from '@right-trade/shared';
import { Avatar, Badge, Card, EmptyState, ErrorState, Input, LoadingState, PillTabs, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { providersApi } from '../../api/endpoints';
import { useAsync } from '../../hooks/useAsync';
import { formatCompactNumber, formatPercent } from '../../utils/format';
import { EquityCurveChart } from '../../components/charts/EquityCurveChart';
import { MarketplaceStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MarketplaceStackParamList, 'Marketplace'>;

const FILTERS: { value: AssetClass | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'forex', label: 'Forex' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'indices', label: 'Indices' },
  { value: 'commodities', label: 'Commodities' },
];

function riskLabel(score: number): string {
  if (score <= 3) return 'Low risk';
  if (score <= 6) return 'Medium risk';
  return 'High risk';
}

function riskTone(score: number): 'positive' | 'warning' | 'negative' {
  if (score <= 3) return 'positive';
  if (score <= 6) return 'warning';
  return 'negative';
}

export function MarketplaceScreen({ navigation }: Props) {
  const providers = useAsync(() => providersApi.list(), []);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AssetClass | 'all'>('all');

  const filtered = useMemo(() => {
    return (providers.data ?? []).filter((p) => {
      const matchesQuery = p.displayName.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === 'all' || p.assetsTraded.includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [providers.data, query, filter]);

  return (
    <Screen refreshing={providers.isRefreshing} onRefresh={providers.refresh}>
      <Text variant="h1">Copy Trading</Text>
      <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
        Browse strategy providers and allocate paper capital to mirror their trades.
      </Text>

      <Input
        placeholder="Search providers"
        value={query}
        onChangeText={setQuery}
        containerStyle={{ marginTop: spacing.lg }}
      />
      <View style={{ marginTop: spacing.md }}>
        <PillTabs options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
        {providers.isLoading ? (
          <LoadingState />
        ) : providers.error ? (
          <ErrorState message={providers.error} onRetry={providers.refetch} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No providers match" message="Try a different search or filter." />
        ) : (
          filtered.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} onPress={() => navigation.navigate('ProviderProfile', { providerId: provider.id })} />
          ))
        )}
      </View>
    </Screen>
  );
}

function ProviderCard({ provider, onPress }: { provider: ProviderProfile; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', gap: spacing.md, flex: 1 }}>
            <Avatar name={provider.displayName} color={provider.avatarColor} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="bodyMedium">{provider.displayName}</Text>
              <Text variant="caption" tone="secondary">
                {formatCompactNumber(provider.followers)} followers · {provider.assetsTraded.join(', ')}
              </Text>
            </View>
          </View>
          <Badge label={riskLabel(provider.riskScore)} tone={riskTone(provider.riskScore)} />
        </View>

        <View style={{ marginTop: spacing.md }}>
          <EquityCurveChart data={provider.equityCurve} height={60} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
          <Stat label="Net profit" value={formatPercent(provider.netProfitPercent)} tone="positive" />
          <Stat label="Win rate" value={`${provider.winRate}%`} />
          <Stat label="Max drawdown" value={`${provider.maxDrawdownPercent}%`} tone="negative" />
        </View>
      </Card>
    </Pressable>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'positive' | 'negative' }) {
  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <Text variant="bodyMedium" tone={tone}>
        {value}
      </Text>
    </View>
  );
}
