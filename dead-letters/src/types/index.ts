export type DLQStatus = 'PENDING' | 'RETRYING' | 'DISCARDED' | 'RESOLVED';

export interface DeadLetterEntry {
  id: string;
  eventKey: string;
  tenantId: string;
  errorMessage: string;
  errorCode: string;
  retryCount: number;
  maxRetries: number;
  status: DLQStatus;
  failedAt: string;
  lastRetryAt: string | null;
  payload: Record<string, unknown>;
}
