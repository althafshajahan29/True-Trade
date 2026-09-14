import React, { useEffect } from 'react';
import { View } from 'react-native';
import { ThemePreference } from '@right-trade/shared';
import { Avatar, Button, Card, Divider, ListRow, PillTabs, Screen, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency } from '../../utils/format';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
];

const CURRENCY_OPTIONS: { value: 'USD' | 'EUR' | 'GBP'; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

export function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { settings, load, setTheme, setCurrency, setNotificationPref } = useSettingsStore();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen>
      <Text variant="h1">Settings</Text>

      {user && (
        <Card style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Avatar name={user.displayName} color={user.avatarColor} size={48} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyMedium">{user.displayName}</Text>
            <Text variant="caption" tone="secondary">
              {user.email}
            </Text>
          </View>
        </Card>
      )}

      <Section title="Account">
        <Card padded={false}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ListRow label="Trading mode" value={user?.tradingMode === 'live' ? 'Live' : 'Paper'} />
            <Divider />
            <ListRow label="Paper balance" value={user?.paperBalance !== undefined ? formatCurrency(user.paperBalance) : '—'} />
            <Divider />
            <ListRow label="Base currency" value={user?.baseCurrency} />
          </View>
        </Card>
      </Section>

      <Section title="Appearance">
        <PillTabs options={THEME_OPTIONS} value={settings.theme} onChange={setTheme} scrollable={false} />
      </Section>

      <Section title="Currency">
        <PillTabs options={CURRENCY_OPTIONS} value={settings.currency} onChange={setCurrency} scrollable={false} />
      </Section>

      <Section title="Notifications">
        <Card padded={false}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ListRow
              label="Push notifications"
              switchValue={settings.notifications.pushEnabled}
              onSwitchChange={(v) => setNotificationPref('pushEnabled', v)}
            />
            <Divider />
            <ListRow
              label="Bot error alerts"
              switchValue={settings.notifications.botErrorAlerts}
              onSwitchChange={(v) => setNotificationPref('botErrorAlerts', v)}
            />
            <Divider />
            <ListRow
              label="Risk alerts"
              switchValue={settings.notifications.riskAlerts}
              onSwitchChange={(v) => setNotificationPref('riskAlerts', v)}
            />
            <Divider />
            <ListRow
              label="Trade execution alerts"
              switchValue={settings.notifications.tradeExecutionAlerts}
              onSwitchChange={(v) => setNotificationPref('tradeExecutionAlerts', v)}
            />
            <Divider />
            <ListRow
              label="Price alerts"
              switchValue={settings.notifications.priceAlerts}
              onSwitchChange={(v) => setNotificationPref('priceAlerts', v)}
            />
          </View>
        </Card>
      </Section>

      <Section title="Security">
        <Card padded={false}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ListRow label="Change password" showChevron onPress={() => undefined} />
            <Divider />
            <ListRow label="Two-factor authentication" value="Off" showChevron onPress={() => undefined} />
          </View>
        </Card>
      </Section>

      <Section title="Legal">
        <Card padded={false}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <ListRow label="Risk disclosure" showChevron onPress={() => undefined} />
            <Divider />
            <ListRow label="Terms of service" showChevron onPress={() => undefined} />
            <Divider />
            <ListRow label="Privacy policy" showChevron onPress={() => undefined} />
          </View>
        </Card>
      </Section>

      <Button label="Sign out" variant="secondary" onPress={signOut} style={{ marginTop: spacing.xxl }} />
    </Screen>
  );
}
