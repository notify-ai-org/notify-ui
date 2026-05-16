/**
 * Structured logger.
 *
 * Features:
 *  - Minimum log level (controlled by LOG_LEVEL env var or runtime config).
 *  - Consistent JSON-like format: { level, message, context, timestamp }.
 *  - In production, debug/info messages are suppressed unless overridden.
 *  - Pluggable transport: by default writes to console; can be replaced
 *    (e.g. to send to a log aggregator) via setLogTransport().
 */

import type { LogEntry, LogLevel } from '../types';

type LogTransport = (entry: LogEntry) => void;

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

let _minLevel: LogLevel =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LOG_LEVEL) as LogLevel | undefined) ??
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ? 'debug' : 'warn');

let _transport: LogTransport = defaultTransport;

export function setLogLevel(level: LogLevel): void {
  _minLevel = level;
}

export function setLogTransport(transport: LogTransport): void {
  _transport = transport;
}

// ---------------------------------------------------------------------------
// Logger object
// ---------------------------------------------------------------------------

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[_minLevel]) return;

  const entry: LogEntry = {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  _transport(entry);
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    emit('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    emit('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    emit('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    emit('error', message, context),
};

// ---------------------------------------------------------------------------
// Default console transport
// ---------------------------------------------------------------------------

function defaultTransport(entry: LogEntry): void {
  const prefix = `[notify-ui] [${entry.timestamp}] [${entry.level.toUpperCase()}]`;
  const args: unknown[] = [prefix, entry.message];
  if (entry.context) args.push(entry.context);

  switch (entry.level) {
    case 'debug': console.debug(...args); break;
    case 'info':  console.info(...args);  break;
    case 'warn':  console.warn(...args);  break;
    case 'error': console.error(...args); break;
  }
}
