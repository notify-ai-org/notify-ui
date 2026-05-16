/**
 * Barrel export — the single entry point for all shared library exports.
 *
 * Microfrontends import exclusively from '@notify-ui/shared':
 *
 *   import {
 *     initApiConfig,
 *     createSharedStore,
 *     httpService,
 *     useHttp,
 *     useModal,
 *     useLogger,
 *     ModalProvider,
 *     logger,
 *     registerErrorHandlerStore,
 *     registerHttpServiceStore,
 *   } from '@notify-ui/shared';
 */

// ---------------------------------------------------------------------------
// API config
// ---------------------------------------------------------------------------
export { initApiConfig, getApiConfig } from './api/apiConfig';
export type { ApiConfig } from './api/apiConfig';

// ---------------------------------------------------------------------------
// Axios / interceptors
// ---------------------------------------------------------------------------
export { getAxiosInstance, resetAxiosInstance, ApiError } from './api/interceptors';

// ---------------------------------------------------------------------------
// Redux store factory + slices
// ---------------------------------------------------------------------------
export { createSharedStore } from './store';
export type { SharedStore, SharedRootState, SharedSlices } from './store';

// Cache slice actions (consumed by microfrontend module action files)
export {
  setEntry,
  invalidateEntry,
  invalidateByPrefix,
  clearCache,
  registerRollback,
  applyRollback,
  clearRollback,
} from './store/slices/cacheSlice';
export type { CacheState } from './store/slices/cacheSlice';

// Modal slice actions (consumed by microfrontend module action files)
export { showModal, hideModal, clearModal } from './store/slices/modalSlice';
export type { ModalState } from './store/slices/modalSlice';

// ---------------------------------------------------------------------------
// HTTP service
// ---------------------------------------------------------------------------
export { httpService, registerHttpServiceStore } from './services/httpService';
export type { GetOptions, MutationOptions } from './services/httpService';

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
export {
  registerErrorHandlerStore,
  handleApiError,
  registerPendingMutation,
  clearPendingMutation,
} from './utils/errorHandler';

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------
export { logger, setLogLevel, setLogTransport } from './logger';

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export { useHttp } from './hooks/useHttp';
export type { UseHttpReturn, UseHttpState } from './hooks/useHttp';

export { useModal } from './hooks/useModal';
export type { UseModalReturn } from './hooks/useModal';

export { useLogger } from './hooks/useLogger';

// ---------------------------------------------------------------------------
// Modal components
// ---------------------------------------------------------------------------
export { ModalProvider, NotifyModal } from './modals/ModalProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  HttpMethod,
  RequestConfig,
  ApiResponse,
  OptimisticMutation,
  ModalConfig,
  ModalVariant,
  LogLevel,
  LogEntry,
  CacheEntry,
} from './types';
