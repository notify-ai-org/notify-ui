/**
 * Redux store for the shared library.
 *
 * Each microfrontend creates its own store by calling {@link createSharedStore}
 * and passing its own reducers. The shared slices (cache, modal) are always
 * included.
 *
 * Usage in a microfrontend:
 * ```ts
 * import { createSharedStore } from '@notify-ui/shared';
 * import eventsReducer from './store/eventsSlice';
 *
 * export const store = createSharedStore({ events: eventsReducer });
 * ```
 */

import {
  configureStore,
  type EnhancedStore,
  type Reducer,
  type ReducersMapObject,
} from '@reduxjs/toolkit';
import cacheReducer from './slices/cacheSlice';
import modalReducer from './slices/modalSlice';
import authReducer from './slices/authSlice';

/** The fixed shared slice names — microfrontends must not use these keys. */
export interface SharedSlices {
  auth: ReturnType<typeof authReducer>;
  cache: ReturnType<typeof cacheReducer>;
  modal: ReturnType<typeof modalReducer>;
}

export type SharedRootState = SharedSlices & Record<string, unknown>;

/**
 * Creates a Redux store pre-loaded with the shared cache and modal slices.
 *
 * @param additionalReducers   Reducers owned by the microfrontend.
 */
let sharedStoreInstance: any = null;

export function createSharedStore<
  R extends ReducersMapObject<Record<string, unknown>>,
>(additionalReducers?: R) {
  const store = configureStore({
    reducer: {
      auth: authReducer as Reducer,
      cache: cacheReducer as Reducer,
      modal: modalReducer as Reducer,
      ...(additionalReducers ?? {}),
    },
  });
  sharedStoreInstance = store;
  return store;
}

export function getSharedStore(): EnhancedStore | null {
  return sharedStoreInstance;
}

/** The store type returned by createSharedStore with no extra reducers. */
export type SharedStore = ReturnType<typeof createSharedStore<{}>>;

// ---------------------------------------------------------------------------
// Typed hooks helpers (microfrontends call these with their own store type)
// ---------------------------------------------------------------------------
export type { TypedUseSelectorHook } from 'react-redux';
