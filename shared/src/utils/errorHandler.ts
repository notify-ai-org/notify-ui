/**
 * Central error handler.
 *
 * Called by the Axios response interceptor on every failed request.
 * Responsibilities:
 *   1. Log the error via the structured logger.
 *   2. Trigger rollback of any pending optimistic Redux updates.
 *   3. Dispatch a showModal action so the user sees an appropriate message.
 *
 * The handler needs access to the Redux store. Because the store is created
 * per-microfrontend (and therefore not available at module load time), it is
 * registered at runtime via {@link registerErrorHandlerStore}.
 */

import type { ApiError } from '../api/interceptors';
import { logger } from '../logger';
import { showModal } from '../store/slices/modalSlice';
import { applyRollback } from '../store/slices/cacheSlice';
import type { SharedStore } from '../store';

// ---------------------------------------------------------------------------
// Store registration
// ---------------------------------------------------------------------------

let _store: SharedStore | null = null;

/**
 * Must be called once after the microfrontend creates its Redux store.
 * Without this call, rollback and modal dispatch will not work.
 */
export function registerErrorHandlerStore(store: SharedStore): void {
  _store = store;
}

// ---------------------------------------------------------------------------
// Pending mutation registry
// ---------------------------------------------------------------------------

/**
 * Mutation IDs that are currently in-flight. The HTTP service registers an
 * ID here before dispatching; it clears it on success or failure.
 */
const _pendingMutations = new Set<string>();

export function registerPendingMutation(mutationId: string): void {
  _pendingMutations.add(mutationId);
}

export function clearPendingMutation(mutationId: string): void {
  _pendingMutations.delete(mutationId);
}

// ---------------------------------------------------------------------------
// Main error handler
// ---------------------------------------------------------------------------

export function handleApiError(error: ApiError, mutationId?: string): void {
  // 1 — Log
  logger.error(`API error [${error.code}]: ${error.message}`, {
    status: error.status,
    code: error.code,
  });

  if (!_store) {
    console.warn('[notify-ui] errorHandler: no store registered — skipping rollback & modal.');
    return;
  }

  // 2 — Rollback optimistic update if a mutation ID is tracked
  const id = mutationId ?? [..._pendingMutations].pop();
  if (id) {
    _store.dispatch(applyRollback(id));
    _pendingMutations.delete(id);
  }

  // 3 — Show modal
  const modalMessage = buildUserMessage(error);
  _store.dispatch(
    showModal({
      title: isServerUnresponsive(error) ? 'Server Unreachable' : 'Request Failed',
      message: modalMessage,
      variant: error.status === 403 ? 'warning' : 'error',
      autoCloseMs: 0,
      confirmLabel: 'Dismiss',
    }),
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isServerUnresponsive(error: ApiError): boolean {
  return error.status === 0 || error.code === 'NETWORK_ERROR';
}

function buildUserMessage(error: ApiError): string {
  if (isServerUnresponsive(error)) {
    return 'The server could not be reached. Your changes have been reverted. Please try again later.';
  }
  if (error.status === 401) return 'Your session has expired. Please log in again.';
  if (error.status === 403) return 'You do not have permission to perform this action.';
  if (error.status === 404) return 'The requested resource was not found.';
  if (error.status >= 500) return 'A server error occurred. Please try again or contact support.';
  return error.message || 'An unexpected error occurred.';
}
