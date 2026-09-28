export type TemplateChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'WEBHOOK' | 'IN_APP';
export type TemplateStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';

export interface Template {
  id: string;
  name: string;
  channel: TemplateChannel;
  status: TemplateStatus;
  subject: string | null;
  body: string;
  resolvedBody?: string;
  resolvedSubject?: string | null;
  variables: string[];
  version: number;
  eventKey: string;
  /** BCP 47 tag of a recipient-language variant; null for the default copy. */
  language?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateValidationResult {
  valid: boolean;
  errors: Array<{ line: number; message: string }>;
  warnings: string[];
  resolvedVariables: string[];
}
