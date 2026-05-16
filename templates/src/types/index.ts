export type TemplateChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK' | 'IN_APP';
export type TemplateStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface Template {
  id: string;
  name: string;
  channel: TemplateChannel;
  status: TemplateStatus;
  subject: string | null;
  body: string;
  variables: string[];
  version: number;
  eventKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: Array<{ line: number; message: string }>;
  warnings: string[];
  resolvedVariables: string[];
}
