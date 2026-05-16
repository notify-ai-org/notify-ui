export interface DomainEntry {
  id: string;
  name: string;
  description: string;
  schemaVersion: string;
  active: boolean;
  createdAt: string;
  fieldCount: number;
}

export interface DomainField {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'OBJECT' | 'ARRAY';
  required: boolean;
  description: string;
  defaultValue: unknown;
}

export interface DomainForm {
  id: string;
  domainId: string;
  title: string;
  fields: DomainField[];
  samplePayload: Record<string, unknown>;
}
