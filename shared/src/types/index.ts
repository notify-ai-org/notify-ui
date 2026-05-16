/**
 * Shared types used across the library.
 * Consuming microfrontends import from here for type safety.
 */

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig {
  /** REST endpoint path (relative to baseURL). */
  url: string;
  method: HttpMethod;
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  /** Milliseconds before the request is aborted. Defaults to 10 000. */
  timeoutMs?: number;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Mutation + optimistic update
// ---------------------------------------------------------------------------

/**
 * Describes an optimistic mutation that the HTTP service will apply to the
 * Redux store before sending the request, and roll back if the request fails.
 */
export interface OptimisticMutation<S = unknown> {
  /** Unique key used to identify and roll back this mutation. */
  id: string;
  /** Snapshot of the slice of state to restore on rollback. */
  rollbackState: S;
  /** The Redux action creator (thunk) to call on rollback. */
  rollback: (snapshot: S) => void;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export type ModalVariant = 'success' | 'error' | 'warning' | 'info';

export interface ModalConfig {
  title: string;
  message: string;
  variant: ModalVariant;
  /** Milliseconds before auto-dismiss. 0 = no auto-dismiss. */
  autoCloseMs?: number;
  /** Label for the primary action button. */
  confirmLabel?: string;
  onConfirm?: () => void;
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Redux cache
// ---------------------------------------------------------------------------

export interface CacheEntry<T = unknown> {
  data: T;
  fetchedAt: number;
  /** TTL in milliseconds. 0 = no expiration. */
  ttlMs: number;
}
