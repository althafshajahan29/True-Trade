import { SignalClassification } from '@right-trade/shared';
import { BadgeTone } from '../../components/ui';

export function classificationTone(classification: SignalClassification): BadgeTone {
  if (classification === 'strong_bullish' || classification === 'bullish') return 'positive';
  if (classification === 'strong_bearish' || classification === 'bearish') return 'negative';
  return 'neutral';
}

export function classificationLabel(classification: SignalClassification): string {
  return classification.replace('_', ' ');
}
