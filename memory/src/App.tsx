import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Brain, Database, Clock, Trash2, Search, Save, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import {
  fetchFacts, deleteFact, fetchMemoryLogs, fetchExpiryConfig, saveExpiryConfig,
  setFactsPage, setMemLogsPage, updateConfig,
} from './store/slices/memorySlice';
import type { Fact, MemoryLog, ExpiryConfig } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(fn: (s: RootState) => T) => useSelector<RootState, T>(fn);
const ACCENT = '#a855f7';
const configuredBase = import.meta.env.VITE_PORTAL_BASE;
const defaultBase =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/portals/memory')
    ? '/portals/memory/'
    : '/';
const BASE =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? undefined
    : configuredBase ?? defaultBase;

/* ── Layout ── */
function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Brain size={20} style={{ color: ACCENT }} />
        <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #c084fc)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Memory</span>
      </div>
      <span className="nav-section-label">Manage</span>
      {[{ to: '/', label: 'Facts', icon: Database }, { to: '/logs', label: 'Memory Logs', icon: Clock }, { to: '/expiry', label: 'Expiry Config', icon: RefreshCw }]
        .map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={15} />{label}
          </NavLink>
        ))}
    </aside>
  );
}

/* ── Pagination ── */
function Pager({ page, total, onChange }: { page: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 0} onClick={() => onChange(page - 1)}><ChevronLeft size={14} /></button>
      {[...Array(Math.min(total, 5))].map((_, i) => {
        const p = total <= 5 ? i : Math.max(0, page - 2) + i;
        return <button key={p} className={`page-btn${p === page ? ' active' : ''}`} onClick={() => onChange(p)}>{p + 1}</button>;
      })}
      <button className="page-btn" disabled={page === total - 1} onClick={() => onChange(page + 1)}><ChevronRight size={14} /></button>
    </div>
  );
}

/* ── Facts Table ── */
function Facts() {
  const dispatch = useD();
  const { items, loading, page, totalPages } = useS(s => (s as any).facts) as any;
  const [tenant, setTenant] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { dispatch(fetchFacts({ page, tenant })); }, [dispatch, page, tenant]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><Database size={15} /> Facts Store</span>
        <span style={{ fontSize: 12, color: '#475569' }}>{items.length} items</span>
      </div>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10 }}>
        <div className="search-input"><Search size={14} /><input placeholder="Filter by tenant ID…" value={tenant} onChange={e => setTenant(e.target.value)} /></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        {loading ? <div style={{ padding: 24 }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />)}</div> : (
          <table className="data-table">
            <thead><tr><th>Fact Key</th><th>Tenant</th><th>Event</th><th>Source</th><th>Generated</th><th>Expires</th><th></th></tr></thead>
            <tbody>
              {(items as Fact[]).map((f) => (
                <React.Fragment key={f.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}>
                    <td><span className="mono" style={{ color: ACCENT }}>{f.key}</span></td>
                    <td><span className="mono" style={{ color: '#94a3b8', fontSize: 11 }}>{f.tenantId}</span></td>
                    <td><span className="mono" style={{ color: '#64748b', fontSize: 11 }}>{f.eventKey}</span></td>
                    <td style={{ color: '#475569' }}>{f.source}</td>
                    <td style={{ color: '#64748b' }}>{format(parseISO(f.generatedAt), 'MMM d HH:mm')}</td>
                    <td style={{ color: f.expiresAt ? '#f59e0b' : '#334155' }}>{f.expiresAt ? format(parseISO(f.expiresAt), 'MMM d') : '∞'}</td>
                    <td><button className="btn-icon" style={{ color: '#ef4444' }} onClick={e => { e.stopPropagation(); dispatch(deleteFact(f.id)); }}><Trash2 size={13} /></button></td>
                  </tr>
                  {expandedId === f.id && (
                    <tr><td colSpan={7} style={{ background: 'rgba(168,85,247,0.04)', padding: '12px 20px' }}>
                      <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94a3b8', margin: 0 }}>{JSON.stringify(f.value, null, 2)}</pre>
                    </td></tr>
                  )}
                </React.Fragment>
              ))}
              {!items.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No facts found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <Pager page={page} total={totalPages} onChange={p => dispatch(setFactsPage(p))} />
    </div>
  );
}

/* ── Memory Logs ── */
function MemoryLogs() {
  const dispatch = useD();
  const { items, loading, page, totalPages } = useS(s => (s as any).memLogs) as any;

  useEffect(() => { dispatch(fetchMemoryLogs(page)); }, [dispatch, page]);

  const OP_COLORS: Record<string, string> = { STORE: '#22c55e', READ: '#6366f1', EXPIRE: '#f59e0b', DELETE: '#ef4444' };

  return (
    <div className="card">
      <div className="card-header"><span className="card-title"><Clock size={15} /> Memory Logs</span></div>
      <div style={{ overflowX: 'auto' }}>
        {loading ? <div style={{ padding: 24 }}>{[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 36, marginBottom: 6, borderRadius: 6 }} />)}</div> : (
          <table className="data-table">
            <thead><tr><th>Operation</th><th>Fact Key</th><th>Event</th><th>Tenant</th><th>Expiry (days)</th><th>Timestamp</th></tr></thead>
            <tbody>
              {(items as MemoryLog[]).map(l => (
                <tr key={l.id}>
                  <td><span className="badge" style={{ background: `${OP_COLORS[l.operation]}22`, color: OP_COLORS[l.operation] }}>{l.operation}</span></td>
                  <td><span className="mono" style={{ color: ACCENT }}>{l.factKey}</span></td>
                  <td><span className="mono" style={{ color: '#64748b', fontSize: 11 }}>{l.eventKey}</span></td>
                  <td><span className="mono" style={{ color: '#94a3b8', fontSize: 11 }}>{l.tenantId}</span></td>
                  <td style={{ color: l.expiryDays ? '#f59e0b' : '#334155' }}>{l.expiryDays ?? '—'}</td>
                  <td style={{ color: '#475569' }}>{format(parseISO(l.timestamp), 'MMM d HH:mm:ss')}</td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No logs found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <Pager page={page} total={totalPages} onChange={p => dispatch(setMemLogsPage(p))} />
    </div>
  );
}

/* ── Expiry Config ── */
function ExpiryConfigPanel() {
  const dispatch = useD();
  const { config, loading, saving } = useS(s => (s as any).expiry) as any;
  const [tenant, setTenant] = useState('');
  const [newKey, setNewKey] = useState(''); const [newDays, setNewDays] = useState('');

  const load = () => { if (tenant.trim()) dispatch(fetchExpiryConfig(tenant.trim())); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div className="card-header"><span className="card-title"><RefreshCw size={15} /> Expiry Configuration</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div className="search-input" style={{ flex: 1 }}><Search size={14} /><input placeholder="Enter tenant ID…" value={tenant} onChange={e => setTenant(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} /></div>
            <button className="btn btn-primary" onClick={load} disabled={loading}><RefreshCw size={13} />{loading ? 'Loading…' : 'Load'}</button>
          </div>

          {config && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Default Expiry (days)</label>
                <input className="form-input" type="number" value={(config as ExpiryConfig).defaultExpiryDays}
                  onChange={e => dispatch(updateConfig({ defaultExpiryDays: Number(e.target.value) }))} style={{ maxWidth: 160 }} />
              </div>
              <div>
                <div className="form-label" style={{ marginBottom: 10 }}>Per-Key Overrides</div>
                <table className="data-table">
                  <thead><tr><th>Fact Key</th><th>Expiry Days</th><th></th></tr></thead>
                  <tbody>
                    {Object.entries((config as ExpiryConfig).perKeyOverrides).map(([k, d]) => (
                      <tr key={k}>
                        <td><span className="mono" style={{ color: ACCENT }}>{k}</span></td>
                        <td><input className="form-input" type="number" defaultValue={String(d)} style={{ width: 100 }}
                          onChange={e => dispatch(updateConfig({ perKeyOverrides: { ...(config as ExpiryConfig).perKeyOverrides, [k]: Number(e.target.value) } }))} /></td>
                        <td><button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => {
                          const { [k]: _, ...rest } = (config as ExpiryConfig).perKeyOverrides;
                          dispatch(updateConfig({ perKeyOverrides: rest }));
                        }}><Trash2 size={13} /></button></td>
                      </tr>
                    ))}
                    <tr>
                      <td><input className="form-input" placeholder="fact.key" value={newKey} onChange={e => setNewKey(e.target.value)} /></td>
                      <td><input className="form-input" type="number" placeholder="days" value={newDays} onChange={e => setNewDays(e.target.value)} style={{ width: 100 }} /></td>
                      <td><button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { if (newKey && newDays) { dispatch(updateConfig({ perKeyOverrides: { ...(config as ExpiryConfig).perKeyOverrides, [newKey]: Number(newDays) } })); setNewKey(''); setNewDays(''); } }}>Add</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div><button className="btn btn-primary" disabled={saving} onClick={() => dispatch(saveExpiryConfig(config))}><Save size={13} />{saving ? 'Saving…' : 'Save Configuration'}</button></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── App ── */
export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <Sidebar />
        <header className="topbar">
          <div><div className="topbar-title">Memory & Facts</div><div className="topbar-subtitle">View facts, logs and configure expiry</div></div>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Facts />} />
            <Route path="/logs" element={<MemoryLogs />} />
            <Route path="/expiry" element={<ExpiryConfigPanel />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
