import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { PortalSidebar, ProfileMenu, httpService, initApiConfig } from '@notify-ui/shared';
import '../../events/src/styles/global.css';

type LogKind = 'capture' | 'notifications';
type PagedResponse = { content: Array<Record<string, unknown>>; totalPages: number };

initApiConfig({ baseURL: '', getAccessToken: () => document.cookie.match(/notify_access_token=([^;]+)/)?.[1] ?? null });

function LogsApp() {
  const [kind, setKind] = useState<LogKind>('capture');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PagedResponse>({ content: [], totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const next = await httpService.get<PagedResponse>(`/api/admin/data/logs/${kind}`, { params: { page, size: 20, sort: 'timestamp,desc' }, ttlMs: 0 });
      setData(next);
    } finally { setLoading(false); }
  };

  useEffect(() => { setPage(0); }, [kind]);
  useEffect(() => { void load(); }, [kind, page]);

  return <div className="app-shell"><PortalSidebar /><header className="topbar"><div><div className="topbar-title">Logs</div><div className="topbar-subtitle">Event capture and notification delivery records</div></div><div className="topbar-actions"><button className="btn-icon" title="Refresh logs" onClick={() => void load()}><RefreshCw size={15} /></button><ProfileMenu /></div></header><main className="main-content"><section className="card"><div className="card-header"><span className="card-title"><ClipboardList size={15} /> Delivery activity</span><LogTabs kind={kind} onChange={setKind} /></div><LogTable rows={data.content} loading={loading} /><Pagination page={page} totalPages={data.totalPages} onChange={setPage} /></section></main></div>;
}

function LogTabs({ kind, onChange }: { kind: LogKind; onChange: (kind: LogKind) => void }) { return <div style={{ display: 'flex', gap: 8 }}><button className={`btn ${kind === 'capture' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onChange('capture')}>Event Capture Logs</button><button className={`btn ${kind === 'notifications' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => onChange('notifications')}>Notification Logs</button></div>; }
function LogTable({ rows, loading }: { rows: Array<Record<string, unknown>>; loading: boolean }) { const columns = useMemo(() => rows.length ? Object.keys(rows[0]).filter(key => !['payload', 'headers'].includes(key)).slice(0, 8) : [], [rows]); return <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id ?? index)}>{columns.map(column => <td key={column}>{displayValue(row[column])}</td>)}</tr>)}{!loading && !rows.length && <tr><td colSpan={Math.max(columns.length, 1)} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No log records found.</td></tr>}</tbody></table></div>; }
function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (page: number) => void }) { return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 14 }}><button className="btn btn-ghost" disabled={page === 0} onClick={() => onChange(page - 1)}>Previous</button><span style={{ padding: '7px 0', color: 'var(--text-muted)' }}>Page {page + 1}</span><button className="btn btn-ghost" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Next</button></div>; }
function displayValue(value: unknown) { if (value == null) return '—'; return typeof value === 'object' ? JSON.stringify(value) : String(value); }

createRoot(document.getElementById('root')!).render(<LogsApp />);
