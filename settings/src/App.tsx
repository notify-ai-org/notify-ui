import React, { useEffect, useMemo, useState } from 'react';
import { CloudCog, Database, LockKeyhole, Save, Search, Settings } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { PaginationControls, PortalSidebar } from '@notify-ui/shared';
import type { AppDispatch, RootState } from './store';
import {
  fetchManagedConfigurations,
  saveManagedConfiguration,
  updateValue,
} from './store/slices/settingsSlice';
import type { ManagedConfiguration } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(selector: (state: RootState) => T) => useSelector<RootState, T>(selector);

export default function App() {
  const dispatch = useD();
  const { items, loading, savingKey, page, totalPages } = useS(state => state.settings) as {
    items: ManagedConfiguration[];
    loading: boolean;
    savingKey: string | null;
    page: number;
    totalPages: number;
  };
  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchManagedConfigurations());
  }, [dispatch]);

  const filtered = useMemo(() => filterItems(items, query), [items, query]);

  return (
    <div className="app-shell">
      <PortalSidebar />
      <header className="topbar">
        <div>
          <div className="topbar-title">Managed Configuration</div>
          <div className="topbar-subtitle">Runtime configuration discovered from managed fields</div>
        </div>
      </header>
      <main className="main-content">
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <Settings size={15} /> Managed keys
            </span>
            <SearchBox query={query} onChange={setQuery} />
          </div>

          {loading ? (
            <div style={{ padding: 32, color: '#64748b' }}>Loading managed configuration...</div>
          ) : (
            <ConfigurationTable
              items={filtered}
              savingKey={savingKey}
              onValueChange={(key, value) => dispatch(updateValue({ key, value }))}
              onSave={(key, value) => dispatch(saveManagedConfiguration({ key, value }))}
            />
          )}
          <PaginationControls
            page={page}
            totalPages={totalPages}
            disabled={loading}
            onChange={nextPage => dispatch(fetchManagedConfigurations(nextPage))}
          />
        </div>
      </main>
    </div>
  );
}

function SearchBox({
  query,
  onChange,
}: {
  query: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="search-input" style={{ width: 280 }}>
      <Search size={14} />
      <input
        value={query}
        onChange={event => onChange(event.target.value)}
        placeholder="Filter configuration"
      />
    </div>
  );
}

function ConfigurationTable({
  items,
  savingKey,
  onValueChange,
  onSave,
}: {
  items: ManagedConfiguration[];
  savingKey: string | null;
  onValueChange: (key: string, value: string) => void;
  onSave: (key: string, value: string) => void;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th>Source</th>
            <th>Type</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <ConfigurationRow
              key={item.key}
              item={item}
              saving={savingKey === item.key}
              onValueChange={onValueChange}
              onSave={onSave}
            />
          ))}
        </tbody>
      </table>

      {!items.length && (
        <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
          No managed configuration keys found.
        </div>
      )}
    </div>
  );
}

function ConfigurationRow({
  item,
  saving,
  onValueChange,
  onSave,
}: {
  item: ManagedConfiguration;
  saving: boolean;
  onValueChange: (key: string, value: string) => void;
  onSave: (key: string, value: string) => void;
}) {
  return (
    <tr>
      <td>
        <div className="mono" style={{ color: '#e2e8f0', fontSize: 12 }}>{item.key}</div>
        <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{item.description}</div>
      </td>
      <td style={{ minWidth: 250 }}>
        <ValueCell item={item} onValueChange={onValueChange} />
      </td>
      <td><SourceBadge source={item.source} /></td>
      <td>
        <span className="mono" style={{ color: '#64748b', fontSize: 11 }}>{item.valueType}</span>
      </td>
      <td>
        <button
          className="btn btn-primary"
          disabled={!item.editable || saving}
          onClick={() => onSave(item.key, item.value ?? '')}
        >
          <Save size={13} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </td>
    </tr>
  );
}

function ValueCell({
  item,
  onValueChange,
}: {
  item: ManagedConfiguration;
  onValueChange: (key: string, value: string) => void;
}) {
  if (item.sensitive) {
    return (
      <span
        style={{
          color: '#94a3b8',
          fontSize: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <LockKeyhole size={13} /> Managed outside the portal
      </span>
    );
  }

  return (
    <input
      className="form-input"
      disabled={!item.editable}
      value={item.value ?? ''}
      onChange={event => onValueChange(item.key, event.target.value)}
    />
  );
}

function SourceBadge({ source }: { source: ManagedConfiguration['source'] }) {
  const isDatabase = source === 'DB';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        color: isDatabase ? '#60a5fa' : '#fbbf24',
        fontSize: 12,
      }}
    >
      {isDatabase ? <Database size={13} /> : <CloudCog size={13} />}
      {isDatabase ? 'Database' : 'ConfigMap'}
    </span>
  );
}

function filterItems(items: ManagedConfiguration[], query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return items;

  return items.filter(item => `${item.key} ${item.description}`.toLowerCase().includes(term));
}
