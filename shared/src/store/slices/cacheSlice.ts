/**
 * Redux slice: HTTP response cache.
 *
 * Structure:
 *   cache[cacheKey] = { data, fetchedAt, ttlMs }
 *
 * The HTTP service reads from here before sending a GET request.
 * Mutations (POST/PUT/PATCH/DELETE) can optimistically update entries
 * here and register a rollback snapshot.
 *
 * Each microfrontend defines its own cache keys and TTLs.
 * The rollback mechanism stores a snapshot before mutation and
 * restores it on server failure.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CacheEntry } from '../../types';

export interface CacheState {
  entries: Record<string, CacheEntry>;
  /** Pending rollback snapshots keyed by mutation ID. */
  rollbacks: Record<string, CacheEntry | null>;
}

const initialState: CacheState = {
  entries: {},
  rollbacks: {},
};

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    // -----------------------------------------------------------------------
    // Cache management
    // -----------------------------------------------------------------------

    /** Store a successful response. */
    setEntry<T>(
      state: CacheState,
      action: PayloadAction<{ key: string; data: T; ttlMs?: number }>,
    ) {
      const { key, data, ttlMs = 0 } = action.payload;
      state.entries[key] = { data, fetchedAt: Date.now(), ttlMs };
    },

    /** Invalidate one cache entry. */
    invalidateEntry(state, action: PayloadAction<string>) {
      delete state.entries[action.payload];
    },

    /** Invalidate all cache entries matching a prefix. */
    invalidateByPrefix(state, action: PayloadAction<string>) {
      const prefix = action.payload;
      Object.keys(state.entries).forEach((key) => {
        if (key.startsWith(prefix)) delete state.entries[key];
      });
    },

    /** Clear the entire cache. */
    clearCache(state) {
      state.entries = {};
    },

    // -----------------------------------------------------------------------
    // Optimistic update + rollback
    // -----------------------------------------------------------------------

    /**
     * Register a rollback snapshot for a mutation.
     * Called by the HTTP service before applying an optimistic update.
     */
    registerRollback(
      state,
      action: PayloadAction<{ mutationId: string; snapshot: CacheEntry | null }>,
    ) {
      const { mutationId, snapshot } = action.payload;
      state.rollbacks[mutationId] = snapshot;
    },

    /**
     * Restore the snapshot registered under mutationId.
     * Called on server failure.
     */
    applyRollback(state, action: PayloadAction<string>) {
      const mutationId = action.payload;
      const snapshot = state.rollbacks[mutationId];
      if (snapshot !== undefined && snapshot !== null) {
        // The snapshot key is embedded in the mutationId by convention: "<key>:<uuid>"
        const cacheKey = mutationId.split(':')[0];
        if (cacheKey) state.entries[cacheKey] = snapshot;
      }
      delete state.rollbacks[mutationId];
    },

    /** Remove a rollback record after a successful mutation (cleanup). */
    clearRollback(state, action: PayloadAction<string>) {
      delete state.rollbacks[action.payload];
    },
  },
});

export const {
  setEntry,
  invalidateEntry,
  invalidateByPrefix,
  clearCache,
  registerRollback,
  applyRollback,
  clearRollback,
} = cacheSlice.actions;

export default cacheSlice.reducer;
