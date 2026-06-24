import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarClock, RefreshCw, Search } from 'lucide-react';
import { PortalSidebar, ProfileMenu, httpService, initApiConfig } from '@notify-ui/shared';
import '../../events/src/styles/global.css';

type Schedule = { id: string; eventName: string; description?: string; triggerType?: string; scheduledAt?: string; cronExpression?: string; createdAt?: string };
type PagedResponse<T> = { content: T[] };

initApiConfig({ baseURL: '', getAccessToken: () => document.cookie.match(/notify_access_token=([^;]+)/)?.[1] ?? null });

function SchedulesApp() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const page = await httpService.get<PagedResponse<Schedule>>('/api/admin/data/schedules', { params: { page: 0, size: 100 }, ttlMs: 0 });
      setItems(page.content ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  const visibleItems = useMemo(() => items.filter(item => `${item.eventName} ${item.description ?? ''}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  return <div className="app-shell"><PortalSidebar /><header className="topbar"><div><div className="topbar-title">Schedules</div><div className="topbar-subtitle">All event schedules</div></div><div className="topbar-actions"><button className="btn-icon" title="Refresh schedules" onClick={() => void load()}><RefreshCw size={15} /></button><ProfileMenu /></div></header><main className="main-content"><section className="card"><div className="card-header"><span className="card-title"><CalendarClock size={15} /> Event schedules</span></div><div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}><div className="search-input"><Search size={14} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter schedules" /></div></div><ScheduleTable schedules={visibleItems} loading={loading} /></section></main></div>;
}

function ScheduleTable({ schedules, loading }: { schedules: Schedule[]; loading: boolean }) { return <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>Event</th><th>Description</th><th>Trigger</th><th>Scheduled At</th><th>Cron</th><th>Created</th></tr></thead><tbody>{schedules.map(item => <tr key={item.id}><td>{item.eventName}</td><td>{item.description || '—'}</td><td>{item.triggerType || '—'}</td><td>{formatDate(item.scheduledAt)}</td><td className="mono">{item.cronExpression || '—'}</td><td>{formatDate(item.createdAt)}</td></tr>)}{!loading && !schedules.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No schedules found.</td></tr>}</tbody></table></div>; }
function formatDate(value?: string) { return value ? new Date(value).toLocaleString() : '—'; }

createRoot(document.getElementById('root')!).render(<SchedulesApp />);
