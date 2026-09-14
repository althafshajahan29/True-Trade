import React, { useEffect, useMemo, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, View } from 'react-native';
import {
  AssetClass,
  DEFAULT_SCHEDULE,
  INSTRUMENTS,
  PositionSizingMethod,
  StrategyCondition,
  StrategyDirection,
  StrategyInput,
  SUPPORTED_TIMEFRAMES,
  Timeframe,
  generateId,
} from '@right-trade/shared';
import { Button, Card, Input, LoadingState, PillTabs, Screen, Section, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { strategiesApi } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import { StrategiesStackParamList } from '../../navigation/types';
import { ConditionEditor } from './ConditionEditor';

type Props = NativeStackScreenProps<StrategiesStackParamList, 'StrategyBuilder'>;

const ASSET_CLASSES: { value: AssetClass; label: string }[] = [
  { value: 'crypto', label: 'Crypto' },
  { value: 'forex', label: 'Forex' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'indices', label: 'Indices' },
  { value: 'commodities', label: 'Commodities' },
];

const DIRECTIONS: { value: StrategyDirection; label: string }[] = [
  { value: 'long', label: 'Long only' },
  { value: 'short', label: 'Short only' },
  { value: 'both', label: 'Both' },
];

const SIZING_METHODS: { value: PositionSizingMethod; label: string }[] = [
  { value: 'percent_of_equity', label: '% of equity' },
  { value: 'fixed_notional', label: 'Fixed $ amount' },
  { value: 'fixed_units', label: 'Fixed units' },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function emptyCondition(): StrategyCondition {
  return {
    id: generateId(),
    left: { kind: 'indicator', ref: { indicator: 'ema', period: 12 } },
    operator: 'crosses_above',
    right: { kind: 'indicator', ref: { indicator: 'ema', period: 26 } },
  };
}

export function StrategyBuilderScreen({ route, navigation }: Props) {
  const strategyId = route.params?.strategyId;
  const { palette } = useTheme();

  const [isLoading, setIsLoading] = useState(!!strategyId);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('crypto');
  const [symbol, setSymbol] = useState('BTC/USD');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [direction, setDirection] = useState<StrategyDirection>('long');
  const [entryConditions, setEntryConditions] = useState<StrategyCondition[]>([emptyCondition()]);
  const [exitConditions, setExitConditions] = useState<StrategyCondition[]>([emptyCondition()]);
  const [sizingMethod, setSizingMethod] = useState<PositionSizingMethod>('percent_of_equity');
  const [sizingValue, setSizingValue] = useState('10');
  const [stopLoss, setStopLoss] = useState('3');
  const [takeProfit, setTakeProfit] = useState('8');
  const [trailingStop, setTrailingStop] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(DEFAULT_SCHEDULE.daysOfWeek);
  const [startHour, setStartHour] = useState(String(DEFAULT_SCHEDULE.startHourUtc));
  const [endHour, setEndHour] = useState(String(DEFAULT_SCHEDULE.endHourUtc));

  const symbolsForClass = useMemo(() => INSTRUMENTS.filter((i) => i.assetClass === assetClass), [assetClass]);

  useEffect(() => {
    if (!strategyId) return;
    strategiesApi
      .get(strategyId)
      .then((s) => {
        setName(s.name);
        setDescription(s.description);
        setAssetClass(s.assetClass);
        setSymbol(s.symbol);
        setTimeframe(s.timeframe);
        setDirection(s.direction);
        setEntryConditions(s.entryRules[0]?.conditions ?? [emptyCondition()]);
        setExitConditions(s.exitRules[0]?.conditions ?? [emptyCondition()]);
        setSizingMethod(s.positionSizing.method);
        setSizingValue(String(s.positionSizing.value));
        setStopLoss(s.riskControls.stopLossPercent ? String(s.riskControls.stopLossPercent) : '');
        setTakeProfit(s.riskControls.takeProfitPercent ? String(s.riskControls.takeProfitPercent) : '');
        setTrailingStop(s.riskControls.trailingStopPercent ? String(s.riskControls.trailingStopPercent) : '');
        setDaysOfWeek(s.schedule.daysOfWeek);
        setStartHour(String(s.schedule.startHourUtc));
        setEndHour(String(s.schedule.endHourUtc));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load strategy.'))
      .finally(() => setIsLoading(false));
  }, [strategyId]);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  };

  const handleSave = async (activate: boolean) => {
    if (name.trim().length < 2) return setError('Give your strategy a name.');
    if (entryConditions.length === 0) return setError('Add at least one entry condition.');
    setError(null);
    setIsSaving(true);

    const input: StrategyInput = {
      name: name.trim(),
      description,
      assetClass,
      symbol,
      timeframe,
      direction,
      entryRules: [{ id: generateId(), type: 'entry', conditions: entryConditions }],
      exitRules: exitConditions.length > 0 ? [{ id: generateId(), type: 'exit', conditions: exitConditions }] : [],
      positionSizing: { method: sizingMethod, value: Number(sizingValue) || 1 },
      riskControls: {
        stopLossPercent: stopLoss ? Number(stopLoss) : undefined,
        takeProfitPercent: takeProfit ? Number(takeProfit) : undefined,
        trailingStopPercent: trailingStop ? Number(trailingStop) : undefined,
      },
      schedule: { daysOfWeek, startHourUtc: Number(startHour) || 0, endHourUtc: Number(endHour) || 23 },
      status: activate ? 'active' : 'draft',
    };

    try {
      const saved = strategyId ? await strategiesApi.update(strategyId, input) : await strategiesApi.create(input);
      navigation.replace('BacktestLab', { strategyId: saved.id });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save strategy.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Screen><LoadingState label="Loading strategy…" /></Screen>;

  return (
    <Screen>
      <Text variant="h1">{strategyId ? 'Edit strategy' : 'New strategy'}</Text>

      <Section title="Basics">
        <Input label="Strategy name" placeholder="e.g. BTC Momentum Cross" value={name} onChangeText={setName} />
        <Input
          label="Description (optional)"
          placeholder="What is this strategy trying to do?"
          value={description}
          onChangeText={setDescription}
          multiline
          containerStyle={{ marginTop: spacing.md }}
        />
      </Section>

      <Section title="Market">
        <Text variant="caption" tone="secondary">
          Asset class
        </Text>
        <View style={{ marginTop: spacing.sm }}>
          <PillTabs
            options={ASSET_CLASSES}
            value={assetClass}
            onChange={(v) => {
              setAssetClass(v);
              const first = INSTRUMENTS.find((i) => i.assetClass === v);
              if (first) setSymbol(first.symbol);
            }}
          />
        </View>

        <Text variant="caption" tone="secondary" style={{ marginTop: spacing.lg }}>
          Symbol
        </Text>
        <View style={{ marginTop: spacing.sm }}>
          <PillTabs options={symbolsForClass.map((i) => ({ value: i.symbol, label: i.symbol }))} value={symbol} onChange={setSymbol} />
        </View>

        <Text variant="caption" tone="secondary" style={{ marginTop: spacing.lg }}>
          Timeframe
        </Text>
        <View style={{ marginTop: spacing.sm }}>
          <PillTabs
            options={SUPPORTED_TIMEFRAMES.map((t) => ({ value: t, label: t }))}
            value={timeframe}
            onChange={setTimeframe}
            scrollable={false}
          />
        </View>

        <Text variant="caption" tone="secondary" style={{ marginTop: spacing.lg }}>
          Direction
        </Text>
        <View style={{ marginTop: spacing.sm }}>
          <PillTabs options={DIRECTIONS} value={direction} onChange={setDirection} scrollable={false} />
        </View>
      </Section>

      <Section title="Entry conditions">
        <View style={{ gap: spacing.md }}>
          {entryConditions.map((c, i) => (
            <ConditionEditor
              key={c.id}
              condition={c}
              onChange={(next) => setEntryConditions((prev) => prev.map((p, idx) => (idx === i ? next : p)))}
              onRemove={entryConditions.length > 1 ? () => setEntryConditions((prev) => prev.filter((_, idx) => idx !== i)) : undefined}
            />
          ))}
          <Button
            label="+ Add condition"
            variant="secondary"
            onPress={() => setEntryConditions((prev) => [...prev, emptyCondition()])}
          />
        </View>
      </Section>

      <Section title="Exit conditions">
        <View style={{ gap: spacing.md }}>
          {exitConditions.map((c, i) => (
            <ConditionEditor
              key={c.id}
              condition={c}
              onChange={(next) => setExitConditions((prev) => prev.map((p, idx) => (idx === i ? next : p)))}
              onRemove={() => setExitConditions((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
          <Button
            label="+ Add condition"
            variant="secondary"
            onPress={() => setExitConditions((prev) => [...prev, emptyCondition()])}
          />
          {exitConditions.length === 0 && (
            <Text variant="caption" tone="tertiary">
              No exit rule — position will only close via stop loss, take profit, or trailing stop.
            </Text>
          )}
        </View>
      </Section>

      <Section title="Position sizing">
        <PillTabs options={SIZING_METHODS} value={sizingMethod} onChange={setSizingMethod} scrollable={false} />
        <Input
          label={sizingMethod === 'percent_of_equity' ? 'Percent of equity' : sizingMethod === 'fixed_notional' ? 'Dollar amount' : 'Units'}
          keyboardType="decimal-pad"
          value={sizingValue}
          onChangeText={setSizingValue}
          containerStyle={{ marginTop: spacing.md }}
          suffix={sizingMethod === 'percent_of_equity' ? '%' : undefined}
        />
      </Section>

      <Section title="Risk controls">
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Input label="Stop loss %" keyboardType="decimal-pad" value={stopLoss} onChangeText={setStopLoss} containerStyle={{ flex: 1 }} />
          <Input label="Take profit %" keyboardType="decimal-pad" value={takeProfit} onChangeText={setTakeProfit} containerStyle={{ flex: 1 }} />
        </View>
        <Input
          label="Trailing stop % (optional)"
          keyboardType="decimal-pad"
          value={trailingStop}
          onChangeText={setTrailingStop}
          containerStyle={{ marginTop: spacing.md }}
        />
      </Section>

      <Section title="Trading schedule">
        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
          {DAY_LABELS.map((label, day) => {
            const active = daysOfWeek.includes(day);
            return (
              <Pressable
                key={label}
                onPress={() => toggleDay(day)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? palette.accent : palette.card,
                  borderWidth: 1,
                  borderColor: active ? palette.accent : palette.cardBorder,
                }}
              >
                <Text variant="caption" tone={active ? 'onAccent' : 'secondary'}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <Input label="Start hour (UTC)" keyboardType="number-pad" value={startHour} onChangeText={setStartHour} containerStyle={{ flex: 1 }} />
          <Input label="End hour (UTC)" keyboardType="number-pad" value={endHour} onChangeText={setEndHour} containerStyle={{ flex: 1 }} />
        </View>
      </Section>

      {error && (
        <Card style={{ marginTop: spacing.lg, borderColor: palette.negative }}>
          <Text variant="body" tone="negative">
            {error}
          </Text>
        </Card>
      )}

      <View style={{ gap: spacing.md, marginTop: spacing.xxl }}>
        <Button label="Save & continue to backtest" onPress={() => handleSave(true)} loading={isSaving} />
        <Button label="Save as draft" variant="secondary" onPress={() => handleSave(false)} loading={isSaving} />
      </View>
    </Screen>
  );
}
