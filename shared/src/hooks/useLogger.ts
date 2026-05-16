/**
 * useLogger hook
 *
 * Returns a component-scoped logger that automatically prefixes every
 * message with the component name, making log aggregation easier.
 *
 * @example
 * function EventsDashboard() {
 *   const log = useLogger('EventsDashboard');
 *   log.info('Mounted');
 * }
 */

import { useMemo } from 'react';
import { logger } from '../logger';
import type { LogLevel } from '../types';

type ScopedLogger = Record<LogLevel, (message: string, context?: Record<string, unknown>) => void>;

export function useLogger(componentName: string): ScopedLogger {
  return useMemo(
    () => ({
      debug: (msg, ctx) => logger.debug(`[${componentName}] ${msg}`, ctx),
      info:  (msg, ctx) => logger.info(`[${componentName}] ${msg}`, ctx),
      warn:  (msg, ctx) => logger.warn(`[${componentName}] ${msg}`, ctx),
      error: (msg, ctx) => logger.error(`[${componentName}] ${msg}`, ctx),
    }),
    [componentName],
  );
}
