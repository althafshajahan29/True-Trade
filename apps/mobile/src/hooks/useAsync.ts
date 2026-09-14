import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

/** Generic data-fetching hook used by screens: tracks loading/refreshing/error state and exposes refetch/refresh. */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    isLoading: true,
    isRefreshing: false,
    error: null,
  });
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const load = useCallback(async (isRefresh = false) => {
    setState((s) => ({ ...s, isLoading: !isRefresh && s.data === null, isRefreshing: isRefresh, error: null }));
    try {
      const data = await fnRef.current();
      setState({ data, isLoading: false, isRefreshing: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        isRefreshing: false,
        error: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.',
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: () => load(false), refresh: () => load(true) };
}
