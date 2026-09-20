import { useEffect, useState } from 'react';
import { Quote } from '@right-trade/shared';
import { marketApi } from '../api/endpoints';

/** Fetches current quotes for a set of symbols in parallel. Each quote says for itself whether it's real (isLive) or simulated — see Quote.isLive. */
export function useQuotes(symbols: string[]): Record<string, Quote> {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const key = symbols.join(',');

  useEffect(() => {
    if (symbols.length === 0) return;
    let cancelled = false;

    Promise.all(symbols.map((symbol) => marketApi.quote(symbol).catch(() => null))).then((results) => {
      if (cancelled) return;
      const next: Record<string, Quote> = {};
      results.forEach((quote, i) => {
        if (quote) next[symbols[i]] = quote;
      });
      setQuotes(next);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return quotes;
}
