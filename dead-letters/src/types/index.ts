export type DLQStatus = 'PENDING' | 'REPLAYING' | 'REPLAYED' | 'DISCARDED';

export interface DeadLetterEntry {
  id: number;
  notificationId: string;
  channel: string;
  target: string | null;
  originalJobPayload: string;
  resolvedVocabularyPayload: string | null;
  renderedContent: string | null;
  failureCategory: string;
  failureReasonCode: string;
  failureMessage: string | null;
  exceptionClass: string | null;
  stackTrace: string | null;
  attemptCount: number;
  firstAttemptAt: string | null;
  lastAttemptAt: string | null;
  workerId: string | null;
  dispatcherInstanceId: string | null;
  replayStatus: DLQStatus;
  replayedAt: string | null;
  replayRequestedAt?: string | null;
  /** Why the last replay could not dispatch; the entry is PENDING again. */
  replayError?: string | null;
  replayedBy: string | null;
  discardedAt: string | null;
  discardedBy: string | null;
  discardReason: string | null;
  createdAt: string;
}
