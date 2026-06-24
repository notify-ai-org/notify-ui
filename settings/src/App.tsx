import React, { useEffect, useMemo, useState } from 'react';
import { Settings, Save, Search, Database, CloudCog, LockKeyhole } from 'lucide-react';
import { PortalSidebar } from '@notify-ui/shared';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';
import {
  fetchManagedConfigurations,
  saveManagedConfiguration,
  updateValue,
} from './store/slices/settingsSlice';
import type { ManagedConfiguration } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(selector: (state: RootState) => T) => useSelector<RootState, T>(selector);

function SourceBadge({ source }: { source: ManagedConfiguration['source'] }) {
  const isDatabase = source === 'DB';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: isDatabase ? '#60a5fa' : '#fbbf24', fontSize: 12 }}>
      {isDatabase ? <Database size={13} /> : <CloudCog size={13} />}
      {isDatabase ? 'Database' : 'ConfigMap'}
    </span>
  );
}

export default function App() {
  const dispatch = useD();
  const { items, loading, savingKey } = useS(state => (state as any).settings) as {
    items: ManagedConfiguration[];
    loading: boolean;
    savingKey: string | null;
  };
  const [query, setQuery] = useState('');

  useEffect(() => { dispatch(fetchManagedConfigurations()); }, [dispatch]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? items.filter(item => `${item.key} ${item.description}`.toLowerCase().includes(term)) : items;
  }, [items, query]);

  return (
    <div className="app-shell">
      <PortalSidebar />
      <header className="topbar"><div><div className="topbar-title">Managed Configuration</div><div className="topbar-subtitle">Runtime configuration discovered from managed fields</div></div></header>
      <main className="main-content">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Settings size={15} /> Managed keys</span>
            <div className="search-input" style={{ width: 280 }}><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter configuration" /></div>
          </div>
          {loading ? <div style={{ padding: 32, color: '#64748b' }}>Loading managed configuration...</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Key</th><th>Value</th><th>Source</th><th>Type</th><th></th></tr></thead>
                <tbody>{filtered.map(item => (
                  <tr key={item.key}>
                    <td><div className="mono" style={{ color: '#e2e8f0', fontSize: 12 }}>{item.key}</div><div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{item.description}</div></td>
                    <td style={{ minWidth: 250 }}>
                      {item.sensitive ? <span style={{ color: '#94a3b8', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}><LockKeyhole size={13} /> Managed outside the portal</span> : (
                        <input className="form-input" disabled={!item.editable} value={item.value ?? ''} onChange={event => dispatch(updateValue({ key: item.key, value: event.target.value }))} />
                      )}
                    </td>
                    <td><SourceBadge source={item.source} /></td>
                    <td><span className="mono" style={{ color: '#64748b', fontSize: 11 }}>{item.valueType}</span></td>
                    <td><button className="btn btn-primary" disabled={!item.editable || savingKey === item.key} onClick={() => dispatch(saveManagedConfiguration({ key: item.key, value: item.value ?? '' }))}><Save size={13} />{savingKey === item.key ? 'Saving...' : 'Save'}</button></td>
                  </tr>
                ))}</tbody>
              </table>
              {!filtered.length && <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>No managed configuration keys found.</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
