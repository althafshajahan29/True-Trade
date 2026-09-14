import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Card, Input, LoadingState, Screen, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { riskApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';

export function RiskSettingsScreen() {
  const { palette } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [maxDailyLoss, setMaxDailyLoss] = useState('5');
  const [maxOpenPositions, setMaxOpenPositions] = useState('5');
  const [maxCapitalPerBot, setMaxCapitalPerBot] = useState('20');
  const [riskPerTrade, setRiskPerTrade] = useState('1');
  const [drawdownLimit, setDrawdownLimit] = useState('15');
  const [startHour, setStartHour] = useState('0');
  const [endHour, setEndHour] = useState('23');
  const [emergencyStop, setEmergencyStop] = useState(false);

  useEffect(() => {
    riskApi
      .get()
      .then((s) => {
        setMaxDailyLoss(String(s.maxDailyLossPercent));
        setMaxOpenPositions(String(s.maxOpenPositions));
        setMaxCapitalPerBot(String(s.maxCapitalPerBotPercent));
        setRiskPerTrade(String(s.riskPerTradePercent));
        setDrawdownLimit(String(s.drawdownLimitPercent));
        setStartHour(String(s.tradingHoursStartUtc));
        setEndHour(String(s.tradingHoursEndUtc));
        setEmergencyStop(s.emergencyStopEnabled);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load risk settings.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (overrideEmergencyStop?: boolean) => {
    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      await riskApi.update({
        maxDailyLossPercent: Number(maxDailyLoss) || 1,
        maxOpenPositions: Number(maxOpenPositions) || 1,
        maxCapitalPerBotPercent: Number(maxCapitalPerBot) || 1,
        riskPerTradePercent: Number(riskPerTrade) || 1,
        allowedSymbols: [],
        tradingHoursStartUtc: Number(startHour) || 0,
        tradingHoursEndUtc: Number(endHour) || 23,
        drawdownLimitPercent: Number(drawdownLimit) || 1,
        emergencyStopEnabled: overrideEmergencyStop ?? emergencyStop,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save risk settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEmergencyStop = () => {
    const next = !emergencyStop;
    setEmergencyStop(next);
    handleSave(next);
  };

  if (isLoading) return <Screen><LoadingState label="Loading risk settings…" /></Screen>;

  return (
    <Screen>
      <Text variant="h1">Risk Manager</Text>
      <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
        Guardrails that apply across every bot and copy subscription on your account.
      </Text>

      <Card
        style={{
          marginTop: spacing.xl,
          borderColor: emergencyStop ? palette.negative : palette.cardBorder,
          backgroundColor: emergencyStop ? palette.negativeMuted : palette.card,
        }}
      >
        <Text variant="bodyMedium" tone={emergencyStop ? 'negative' : 'primary'}>
          Emergency stop
        </Text>
        <Text variant="body" tone="secondary" style={{ marginTop: spacing.xs }}>
          Immediately blocks every bot from opening new positions. Existing positions are left untouched.
        </Text>
        <Button
          label={emergencyStop ? 'Emergency stop is ON — tap to disable' : 'Activate emergency stop'}
          variant={emergencyStop ? 'secondary' : 'danger'}
          onPress={toggleEmergencyStop}
          loading={isSaving}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      <Section title="Loss limits">
        <Input label="Max daily loss %" keyboardType="decimal-pad" value={maxDailyLoss} onChangeText={setMaxDailyLoss} />
        <Input
          label="Drawdown limit %"
          keyboardType="decimal-pad"
          value={drawdownLimit}
          onChangeText={setDrawdownLimit}
          containerStyle={{ marginTop: spacing.md }}
        />
      </Section>

      <Section title="Position limits">
        <Input label="Max open positions" keyboardType="number-pad" value={maxOpenPositions} onChangeText={setMaxOpenPositions} />
        <Input
          label="Max capital per bot (% of balance)"
          keyboardType="decimal-pad"
          value={maxCapitalPerBot}
          onChangeText={setMaxCapitalPerBot}
          containerStyle={{ marginTop: spacing.md }}
        />
        <Input
          label="Risk per trade %"
          keyboardType="decimal-pad"
          value={riskPerTrade}
          onChangeText={setRiskPerTrade}
          containerStyle={{ marginTop: spacing.md }}
        />
      </Section>

      <Section title="Trading hours (UTC)">
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Input label="Start hour" keyboardType="number-pad" value={startHour} onChangeText={setStartHour} containerStyle={{ flex: 1 }} />
          <Input label="End hour" keyboardType="number-pad" value={endHour} onChangeText={setEndHour} containerStyle={{ flex: 1 }} />
        </View>
      </Section>

      {error && (
        <Text variant="caption" tone="negative" style={{ marginTop: spacing.lg }}>
          {error}
        </Text>
      )}
      {saved && !error && (
        <Text variant="caption" tone="positive" style={{ marginTop: spacing.lg }}>
          Risk settings saved.
        </Text>
      )}

      <Button label="Save changes" onPress={() => handleSave()} loading={isSaving} style={{ marginTop: spacing.lg }} />
    </Screen>
  );
}
