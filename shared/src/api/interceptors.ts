/**
 * Axios instance with request + response interceptors.
 *
 * Request interceptor:
 *   - Injects Authorization header from getAccessToken().
 *   - Applies per-request timeout override.
 *   - Logs outgoing requests when logging is enabled.
 *
 * Response interceptor:
 *   - Logs successful responses.
 *   - Normalises error payloads into a consistent {@link ApiError} shape.
 *   - Triggers rollback + modal display via the error handler.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { getApiConfig } from './apiConfig';
import { logger } from '../logger';
import { handleApiError } from '../utils/errorHandler';
import { redirectToForbidden } from '../navigation/portalNavigation';
import { getSharedStore } from '../store';

// ---------------------------------------------------------------------------
// Public error shape
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly originalError: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Axios instance (lazily configured)
// ---------------------------------------------------------------------------

let _axiosInstance: AxiosInstance | null = null;

export function getAxiosInstance(): AxiosInstance {
  if (_axiosInstance) return _axiosInstance;

  const cfg = getApiConfig();

  _axiosInstance = axios.create({
    baseURL: cfg.baseURL,
    timeout: cfg.timeoutMs ?? 10_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // ------------------------------------------------------------------
  // Request interceptor
  // ------------------------------------------------------------------
  _axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const { getAccessToken, enableRequestLogging } = getApiConfig();

      // Inject auth token
      const sharedStore = getSharedStore();
      const token = sharedStore?.getState().auth.token ?? getAccessToken?.();
      
      if (token) {
        config.headers = config.headers ?? {};
        if (typeof config.headers.set === 'function') {
          config.headers.set('Authorization', `Bearer ${token}`);
        } else {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      }

      // Optional request logging
      if (enableRequestLogging) {
        logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }

      return config;
    },
    (error: unknown) => {
      logger.error('Request setup failed', { error });
      return Promise.reject(error);
    },
  );

  // ------------------------------------------------------------------
  // Response interceptor
  // ------------------------------------------------------------------
  _axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
      if (getApiConfig().enableRequestLogging) {
        logger.debug(`← ${response.status} ${response.config.url}`, {
          data: response.data,
        });
      }
      return response;
    },
    (error: unknown) => {
      const apiError = normaliseError(error);
      const isLoginPortal = typeof window !== 'undefined'
        && window.location.pathname.startsWith('/portals/login');
      if (apiError.status === 401 && !isLoginPortal) {
        // redirectToLogin();
      } else if (apiError.status === 403) {
        redirectToForbidden();
      }
      // Delegate to the central error handler which will trigger rollback + modal
      handleApiError(apiError);
      return Promise.reject(apiError);
    },
  );

  return _axiosInstance;
}

/**
 * Resets the cached Axios instance. Useful when {@link initApiConfig} is
 * called after the first request (e.g. in tests or runtime config refresh).
 */
export function resetAxiosInstance(): void {
  _axiosInstance = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;

    // Network / timeout — server unresponsive
    if (!error.response) {
      return new ApiError(
        0,
        'NETWORK_ERROR',
        'Server is unreachable. Please check your connection.',
        error,
      );
    }

    const errorPayload = error.response.data;
    const serverMessage = extractServerMessage(errorPayload)
      ?? error.message
      ?? 'An unexpected error occurred';
    const code = extractServerCode(errorPayload) ?? `HTTP_${status}`;

    return new ApiError(status, code, String(serverMessage), error);
  }

  if (error instanceof ApiError) return error;

  return new ApiError(0, 'UNKNOWN_ERROR', String(error), error);
}

function extractServerCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return undefined;
  const record = payload as Record<string, unknown>;
  const code = record.code ?? record.errorCode ?? record.error;
  return code == null ? undefined : String(code);
}

function extractServerMessage(payload: unknown): string | undefined {
  if (payload == null) return undefined;
  if (typeof payload === 'string') return payload.trim() || undefined;
  if (Array.isArray(payload)) {
    const messages = payload.map(extractServerMessage).filter(Boolean);
    return messages.length ? messages.join('\n') : undefined;
  }
  if (typeof payload !== 'object') return String(payload);

  const record = payload as Record<string, unknown>;
  const candidate =
    record.message ??
    record.detail ??
    record.error_description ??
    record.errorMessage ??
    record.error;

  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }

  const validationMessages = Object.entries(record)
    .filter(([, value]) => Array.isArray(value) || typeof value === 'string')
    .flatMap(([field, value]) => {
      if (Array.isArray(value)) {
        return value.map(item => `${field}: ${String(item)}`);
      }
      return [`${field}: ${value}`];
    });

  return validationMessages.length ? validationMessages.join('\n') : undefined;
}

/** Convenience re-export so consumers only import from the shared library. */
export type { AxiosRequestConfig };
