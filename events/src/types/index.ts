/** Domain types for the Events portal. */

export type EventType = 'DOMAIN' | 'SYSTEM' | 'SCHEDULED' | 'WEBHOOK';
export type EventStatus = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
export type ScheduleStatus = 'PENDING' | 'RUNNING' | 'PAUSED' | 'FAILED' | 'COMPLETED';
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface RegisteredEvent {
  id: string;
  key: string;
  description: string;
  eventType: EventType;
  priority: number;
  version: string;
  status: EventStatus;
  registeredAt: string;
  ruleCount: number;
  callbackCount: number;
}

export interface ScheduleConfig {
  cronExpression: string;
  timezone: string;
  maxRetries: number;
  retryDelayMs: number;
}

export interface ScheduledEvent {
  id: string;
  eventKey: string;
  description: string;
  status: ScheduleStatus;
  schedule: ScheduleConfig;
  lastRunAt: string | null;
  nextRunAt: string | null;
  successCount: number;
  failureCount: number;
}

export interface CaptureLogEntry {
  id: string;
  eventKey: string;
  tenantId: string;
  capturedAt: string;
  processingTimeMs: number;
  rulesFired: number;
  notificationsSent: number;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  payload: Record<string, unknown>;
}

export interface NotificationLogEntry {
  id: string;
  eventKey: string;
  channel: string;
  recipient: string;
  sentAt: string;
  deliveryStatus: 'DELIVERED' | 'BOUNCED' | 'PENDING' | 'FAILED';
  templateId: string;
  retryCount: number;
}

export interface EventMetrics {
  totalEvents: number;
  activeEvents: number;
  totalCaptures24h: number;
  totalNotifications24h: number;
  avgProcessingTimeMs: number;
  failureRate: number;
  captureTimeline: Array<{ hour: string; captures: number; notifications: number; failures: number }>;
  eventsByType: Array<{ type: EventType; count: number }>;
  topEvents: Array<{ key: string; captures: number }>;
}
