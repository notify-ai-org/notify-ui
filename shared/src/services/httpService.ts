/**
 * HTTP service — the primary API for making REST calls from microfrontends.
 *
 * How it works:
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  GET requests                                                           │
 * │  1. Check Redux cache (cache[key]); return cached data if not expired.  │
 * │  2. If stale or missing, fire Axios GET.                                │
 * │  3. Store response in cache[key].                                       │
 * │                                                                         │
 * │  Mutation requests (POST / PUT / PATCH / DELETE)                        │
 * │  1. Caller optionally provides an optimistic update callback + key.     │
 * │  2. Snapshot the current cache entry → register rollback.              │
 * │  3. Apply the optimistic update to the Redux store.                     │
 * │  4. Register mutation ID in the error handler.                          │
 * │  5. Fire Axios request.                                                 │
 * │     ✓ Success → invalidate related cache keys + optional success modal. │
 * │     ✗ Failure → errorHandler rolls back + shows error modal.            │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { v4 as uuidv4 } from 'uuid';
import { getAxiosInstance } from '../api/interceptors';
import {
  setEntry,
  invalidateEntry,
  registerRollback,
  clearRollback,
} from '../store/slices/cacheSlice';
import { showModal } from '../store/slices/modalSlice';
import {
  registerPendingMutation,
  clearPendingMutation,
} from '../utils/errorHandler';
import { logger } from '../logger';
import type { SharedStore } from '../store';
import type { ApiResponse, CacheEntry, ModalConfig } from '../types';

// ---------------------------------------------------------------------------
// Store registration
// ---------------------------------------------------------------------------

let _store: SharedStore | null = null;

export function registerHttpServiceStore(store: SharedStore): void {
  _store = store;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

const DEFAULT_TTL = 5 * 60 * 1_000; // 5 minutes

function getCachedEntry(key: string): CacheEntry | null {
  if (!_store) return null;
  const entry = _store.getState().cache.entries[key] as CacheEntry | undefined;
  if (!entry) return null;
  if (entry.ttlMs > 0 && Date.now() - entry.fetchedAt > entry.ttlMs) return null; // expired
  return entry;
}

// ---------------------------------------------------------------------------
// GET — with cache
// ---------------------------------------------------------------------------

export interface GetOptions {
  /** Cache key. Defaults to the URL + stringified params. */
  cacheKey?: string;
  /** TTL in ms. Default 5 min. Pass 0 to skip caching. */
  ttlMs?: number;
  /** Force refetch even if a valid cache entry exists. */
  forceRefresh?: boolean;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export async function get<T = unknown>(
  url: string,
  options: GetOptions = {},
): Promise<T> {
  const {
    cacheKey = buildCacheKey(url, options.params),
    ttlMs = DEFAULT_TTL,
    forceRefresh = false,
    params,
    headers,
  } = options;

  // Serve from cache
  if (!forceRefresh && ttlMs > 0) {
    const cached = getCachedEntry(cacheKey);
    if (cached) {
      logger.debug(`[httpService] Cache hit: ${cacheKey}`);
      return cached.data as T;
    }
  }

  const axios = getAxiosInstance();
  const response = await axios.get<T>(url, { params, headers });

  // Store in cache
  if (_store && ttlMs > 0) {
    _store.dispatch(setEntry({ key: cacheKey, data: response.data, ttlMs }));
  }

  return response.data;
}

// ---------------------------------------------------------------------------
// Mutation — with optimistic update + rollback
// ---------------------------------------------------------------------------

export interface MutationOptions {
  /**
   * Cache key to invalidate after a successful mutation.
   * Also used as the prefix for the rollback snapshot key.
   */
  invalidateKey?: string;
  /**
   * Optimistic update: a function that synchronously mutates the Redux store
   * before the request is sent.  The HTTP service takes a snapshot of
   * invalidateKey's cache entry beforehand so it can roll back.
   */
  optimisticUpdate?: (store: SharedStore) => void;
  /** Success modal config. Pass null to suppress the modal. */
  successModal?: ModalConfig | null;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

type MutationMethod = 'post' | 'put' | 'patch' | 'delete';

async function mutate<T = unknown>(
  method: MutationMethod,
  url: string,
  options: MutationOptions = {},
): Promise<ApiResponse<T>> {
  const {
    invalidateKey,
    optimisticUpdate,
    successModal,
    data,
    params,
    headers,
    timeoutMs,
  } = options;

  // Build a unique mutation ID  ("<cacheKey>:<uuid>" pattern for the rollback slice)
  const mutationId = `${invalidateKey ?? 'mutation'}:${uuidv4()}`;

  // Snapshot + optimistic update
  if (_store && invalidateKey) {
    const currentEntry = _store.getState().cache.entries[invalidateKey] as CacheEntry | undefined;
    _store.dispatch(
      registerRollback({ mutationId, snapshot: currentEntry ?? null }),
    );
  }

  if (_store && optimisticUpdate) {
    optimisticUpdate(_store);
  }

  registerPendingMutation(mutationId);

  try {
    const axios = getAxiosInstance();
    const response = await (method === 'delete'
      ? axios.delete<T>(url, { params, headers, timeout: timeoutMs })
      : axios[method]<T>(url, data, { params, headers, timeout: timeoutMs }));

    // Success: clean up rollback record + invalidate stale cache entry
    if (_store) {
      _store.dispatch(clearRollback(mutationId));
      if (invalidateKey) {
        _store.dispatch(invalidateEntry(invalidateKey));
      }

      // Success modal (opt-in)
      if (successModal !== null && successModal !== undefined) {
        _store.dispatch(showModal(successModal));
      }
    }

    clearPendingMutation(mutationId);

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  } catch (error) {
    // The Axios interceptor already called handleApiError (rollback + modal).
    // We just propagate so the caller can also handle it if needed.
    clearPendingMutation(mutationId);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const httpService = {
  get,
  post: <T = unknown>(url: string, options?: MutationOptions) =>
    mutate<T>('post', url, options),
  put: <T = unknown>(url: string, options?: MutationOptions) =>
    mutate<T>('put', url, options),
  patch: <T = unknown>(url: string, options?: MutationOptions) =>
    mutate<T>('patch', url, options),
  delete: <T = unknown>(url: string, options?: MutationOptions) =>
    mutate<T>('delete', url, options),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildCacheKey(url: string, params?: Record<string, unknown>): string {
  if (!params || Object.keys(params).length === 0) return url;
  return `${url}?${new URLSearchParams(params as Record<string, string>).toString()}`;
}
