import React from 'react';
import { View } from 'react-native';
import { ComparisonOperator, IndicatorType, RuleOperand, StrategyCondition } from '@right-trade/shared';
import { Card, Input, PillTabs, Text } from '../../components/ui';
import { spacing } from '../../theme/tokens';
import { useTheme } from '../../theme';
import { Pressable } from 'react-native';

const INDICATOR_OPTIONS: { value: IndicatorType; label: string; hasPeriod: boolean }[] = [
  { value: 'price', label: 'Price', hasPeriod: false },
  { value: 'sma', label: 'SMA', hasPeriod: true },
  { value: 'ema', label: 'EMA', hasPeriod: true },
  { value: 'rsi', label: 'RSI', hasPeriod: true },
  { value: 'macd', label: 'MACD', hasPeriod: false },
  { value: 'macd_signal', label: 'MACD Signal', hasPeriod: false },
  { value: 'bollinger_upper', label: 'Boll. Upper', hasPeriod: true },
  { value: 'bollinger_lower', label: 'Boll. Lower', hasPeriod: true },
  { value: 'atr', label: 'ATR', hasPeriod: true },
  { value: 'volume', label: 'Volume', hasPeriod: false },
];

const OPERATOR_OPTIONS: { value: ComparisonOperator; label: string }[] = [
  { value: 'crosses_above', label: 'crosses above' },
  { value: 'crosses_below', label: 'crosses below' },
  { value: 'greater_than', label: '>' },
  { value: 'less_than', label: '<' },
  { value: 'equal_to', label: '=' },
];

function OperandEditor({
  operand,
  onChange,
  label,
}: {
  operand: RuleOperand;
  onChange: (operand: RuleOperand) => void;
  label: string;
}) {
  const { palette } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Pressable
          onPress={() => onChange({ kind: 'indicator', ref: { indicator: 'price' } })}
          style={{
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            borderRadius: 8,
            backgroundColor: operand.kind === 'indicator' ? palette.accentMuted : 'transparent',
          }}
        >
          <Text variant="caption" tone={operand.kind === 'indicator' ? 'accent' : 'tertiary'}>
            Indicator
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange({ kind: 'constant', value: 0 })}
          style={{
            paddingVertical: spacing.xs,
            paddingHorizontal: spacing.sm,
            borderRadius: 8,
            backgroundColor: operand.kind === 'constant' ? palette.accentMuted : 'transparent',
          }}
        >
          <Text variant="caption" tone={operand.kind === 'constant' ? 'accent' : 'tertiary'}>
            Fixed value
          </Text>
        </Pressable>
      </View>

      {operand.kind === 'indicator' ? (
        <View style={{ gap: spacing.sm }}>
          <PillTabs
            options={INDICATOR_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            value={operand.ref.indicator}
            onChange={(indicator) => {
              const meta = INDICATOR_OPTIONS.find((o) => o.value === indicator);
              onChange({
                kind: 'indicator',
                ref: { indicator, period: meta?.hasPeriod ? (operand.ref.period ?? 14) : undefined },
              });
            }}
          />
          {INDICATOR_OPTIONS.find((o) => o.value === operand.ref.indicator)?.hasPeriod && (
            <Input
              label="Period"
              keyboardType="number-pad"
              value={String(operand.ref.period ?? 14)}
              onChangeText={(text) =>
                onChange({ kind: 'indicator', ref: { indicator: operand.ref.indicator, period: Number(text) || 1 } })
              }
            />
          )}
        </View>
      ) : (
        <Input
          keyboardType="decimal-pad"
          value={String(operand.value)}
          onChangeText={(text) => onChange({ kind: 'constant', value: Number(text) || 0 })}
        />
      )}
    </View>
  );
}

export function ConditionEditor({
  condition,
  onChange,
  onRemove,
}: {
  condition: StrategyCondition;
  onChange: (condition: StrategyCondition) => void;
  onRemove?: () => void;
}) {
  return (
    <Card style={{ gap: spacing.lg }}>
      <OperandEditor label="When" operand={condition.left} onChange={(left) => onChange({ ...condition, left })} />

      <View style={{ gap: spacing.sm }}>
        <Text variant="caption" tone="secondary">
          Operator
        </Text>
        <PillTabs
          options={OPERATOR_OPTIONS}
          value={condition.operator}
          onChange={(operator) => onChange({ ...condition, operator })}
        />
      </View>

      <OperandEditor label="Compared to" operand={condition.right} onChange={(right) => onChange({ ...condition, right })} />

      {onRemove && (
        <Pressable onPress={onRemove}>
          <Text variant="caption" tone="negative">
            Remove condition
          </Text>
        </Pressable>
      )}
    </Card>
  );
}
