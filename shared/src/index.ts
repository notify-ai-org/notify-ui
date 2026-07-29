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
export { ADMIN_PAGE_SIZE, getPaginated } from './api/pagination';
export type { PaginatedResponse, PaginationRequest } from './api/pagination';

// ---------------------------------------------------------------------------
// Redux store factory + slices
// ---------------------------------------------------------------------------
export { createSharedStore, getSharedStore } from './store';
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

// Auth slice actions
export { setToken, clearToken, login, googleLogin, createClient, logout } from './store/slices/authSlice';
export type { AuthState, AuthResponse, RegistrationResponse } from './store/slices/authSlice';

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
// Portal navigation
// ---------------------------------------------------------------------------
export {
  currentPortalPath,
  portalHref,
  portalPath,
  redirectToForbidden,
  redirectToLogin,
  redirectToPortal,
} from './navigation/portalNavigation';
export type { PortalName } from './navigation/portalNavigation';

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

export { usePortalNavigation } from './hooks/usePortalNavigation';
export type { UsePortalNavigationReturn } from './hooks/usePortalNavigation';

export { PortalSidebar } from './components/PortalSidebar';
export { ProfileMenu } from './components/ProfileMenu';
export { PaginationControls } from './components/PaginationControls';
export type { PaginationControlsProps } from './components/PaginationControls';
export { PaginatedTable } from './components/PaginatedTable';

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
