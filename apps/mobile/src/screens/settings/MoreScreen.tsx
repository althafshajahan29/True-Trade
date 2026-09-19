import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { Card, Divider, ListRow, Screen, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { MoreStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MoreStackParamList, 'More'>;

export function MoreScreen({ navigation }: Props) {
  return (
    <Screen>
      <Text variant="h1">More</Text>

      <View style={{ marginTop: spacing.xl }}>
        <Card padded={false}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ListRow label="Analytics" subtitle="Portfolio performance & trends" showChevron onPress={() => navigation.navigate('Analytics')} />
            <Divider />
            <ListRow label="Trade history" subtitle="Every trade across bots & copy trading" showChevron onPress={() => navigation.navigate('TradeHistory')} />
            <Divider />
            <ListRow label="Alerts" subtitle="Price, risk, and bot notifications" showChevron onPress={() => navigation.navigate('Alerts')} />
            <Divider />
            <ListRow label="Risk Manager" subtitle="Guardrails for every bot" showChevron onPress={() => navigation.navigate('RiskSettings')} />
            <Divider />
            <ListRow label="Settings" subtitle="Theme, notifications, account" showChevron onPress={() => navigation.navigate('Settings')} />
          </View>
        </Card>
      </View>
    </Screen>
  );
}
