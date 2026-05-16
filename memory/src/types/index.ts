export interface Fact {
  id: string;
  tenantId: string;
  key: string;
  value: unknown;
  eventKey: string;
  generatedAt: string;
  expiresAt: string | null;
  source: string;
}

export interface MemoryLog {
  id: string;
  tenantId: string;
  operation: 'STORE' | 'READ' | 'EXPIRE' | 'DELETE';
  factKey: string;
  eventKey: string;
  timestamp: string;
  expiryDays: number | null;
}

export interface ExpiryConfig {
  tenantId: string;
  defaultExpiryDays: number;
  perKeyOverrides: Record<string, number>;
}
