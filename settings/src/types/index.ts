export interface ManagedConfiguration {
  key: string;
  value: string | null;
  source: 'DB' | 'CONFIG_MAP';
  valueType: string;
  description: string;
  editable: boolean;
  sensitive: boolean;
}
