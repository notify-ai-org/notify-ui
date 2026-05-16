/**
 * useHttp hook
 *
 * A thin React hook that wraps the {@link httpService} and exposes loading,
 * error, and data state for use in component trees.
 *
 * @example
 * const { data, loading, error, execute } = useHttp<Event[]>();
 *
 * useEffect(() => {
 *   execute(() => httpService.get('/events', { cacheKey: 'events:all' }));
 * }, []);
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from '../logger';

export interface UseHttpState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseHttpReturn<T> extends UseHttpState<T> {
  /**
   * Run an arbitrary HTTP call. Tracks loading and error state automatically.
   * The call must return a Promise.
   */
  execute: (call: () => Promise<T>) => Promise<T | null>;
  /** Reset state to initial values. */
  reset: () => void;
}

const initialState = <T>(): UseHttpState<T> => ({
  data: null,
  loading: false,
  error: null,
});

export function useHttp<T = unknown>(): UseHttpReturn<T> {
  const [state, setState] = useState<UseHttpState<T>>(initialState<T>);
  const abortedRef = useRef(false);

  const execute = useCallback(async (call: () => Promise<T>): Promise<T | null> => {
    abortedRef.current = false;
    setState({ data: null, loading: true, error: null });

    try {
      const result = await call();
      if (!abortedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (!abortedRef.current) {
        logger.warn('[useHttp] request failed', { message: error.message });
        setState({ data: null, loading: false, error });
      }
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    abortedRef.current = true;
    setState(initialState<T>());
  }, []);

  return { ...state, execute, reset };
}
