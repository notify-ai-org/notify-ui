export interface SystemSettings {
  maxRetries: number;
  retryDelayMs: number;
  captureTimeoutMs: number;
  notificationBatchSize: number;
  enableAuditLog: boolean;
  logRetentionDays: number;
  defaultLocale: string;
  defaultTimezone: string;
}

export interface NotificationSettings {
  emailProvider: string;
  smsProvider: string;
  pushProvider: string;
  maxDailyEmailsPerTenant: number;
  maxDailySmsPerTenant: number;
  rateLimitWindowMs: number;
}

export interface SecuritySettings {
  jwtExpirySeconds: number;
  refreshTokenExpiryDays: number;
  maxLoginAttempts: number;
  lockoutDurationMs: number;
  requireMfa: boolean;
  allowedIpRanges: string[];
}
