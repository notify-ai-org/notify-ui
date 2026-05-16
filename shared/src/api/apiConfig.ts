/**
 * Central API configuration.
 *
 * Every microfrontend initialises the shared library once by calling
 * {@link initApiConfig} before mounting. The config is read at request time
 * by the Axios instance and the interceptors.
 */

export interface ApiConfig {
  /** Base URL for all REST calls, e.g. "https://api.notify.internal". */
  baseURL: string;
  /** Default request timeout in milliseconds. Defaults to 10 000. */
  timeoutMs?: number;
  /**
   * Called to obtain the current access token for the Authorization header.
   * Return null / undefined to skip the header.
   */
  getAccessToken?: () => string | null | undefined;
  /**
   * If true, the HTTP service will prefix every log message with "[notify-ui]".
   * Defaults to true in development, false in production.
   */
  enableRequestLogging?: boolean;
}

let _config: ApiConfig = {
  baseURL: '',
  timeoutMs: 10_000,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  enableRequestLogging: (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ?? false,
};

/**
 * Must be called once at application startup before any HTTP requests are made.
 *
 * @example
 * initApiConfig({
 *   baseURL: 'https://api.notify.internal',
 *   getAccessToken: () => localStorage.getItem('access_token'),
 * });
 */
export function initApiConfig(config: ApiConfig): void {
  _config = {
    timeoutMs: 10_000,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    enableRequestLogging: (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ?? false,
    ...config,
  };
}

/** Read the current effective configuration. */
export function getApiConfig(): Readonly<ApiConfig> {
  return _config;
}
