import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { CalendarClock, RefreshCw, Search } from 'lucide-react';
import {
  ModalProvider,
  PaginationControls,
  PortalSidebar,
  ProfileMenu,
  createSharedStore,
  getPaginated,
  initApiConfig,
  registerErrorHandlerStore,
  registerHttpServiceStore,
} from '@notify-ui/shared';
import '../../events/src/styles/global.css';

type Schedule = {
  id?: string;
  eventName: string;
  description?: string;
  channel?: string;
  triggerType?: string;
  scheduledAt?: string;
  cronExpression?: string;
};

initApiConfig({
  baseURL: '',
  getAccessToken: () => document.cookie.match(/notify_access_token=([^;]+)/)?.[1] ?? null,
});

const store = createSharedStore();
registerHttpServiceStore(store);
registerErrorHandlerStore(store);

function SchedulesApp() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getPaginated<Schedule>('/api/admin/data/schedules', {
        page,
        ttlMs: 0,
      });
      setItems(result.content);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  const visibleItems = useMemo(() => filterSchedules(items, query), [items, query]);

  return (
    <div className="app-shell">
      <PortalSidebar />
      <header className="topbar">
        <div>
          <div className="topbar-title">Schedules</div>
          <div className="topbar-subtitle">EventSchedule records</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-icon" title="Refresh schedules" onClick={() => void load()}>
            <RefreshCw size={15} />
          </button>
          <ProfileMenu />
        </div>
      </header>

      <main className="main-content">
        <section className="card">
          <div className="card-header">
            <span className="card-title">
              <CalendarClock size={15} /> Event schedules
            </span>
          </div>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="search-input">
              <Search size={14} />
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="Filter schedules"
              />
            </div>
          </div>
          <ScheduleTable schedules={visibleItems} loading={loading} />
          <PaginationControls page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
        </section>
      </main>
    </div>
  );
}

function ScheduleTable({
  schedules,
  loading,
}: {
  schedules: Schedule[];
  loading: boolean;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Event Name</th>
            <th>Description</th>
            <th>Channel</th>
            <th>Trigger Type</th>
            <th>Scheduled At</th>
            <th>Cron Expression</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((item, index) => (
            <tr key={item.id ?? `${item.eventName ?? 'schedule'}-${item.channel ?? 'channel'}-${index}`}>
              <td>{item.eventName || '-'}</td>
              <td style={{ minWidth: 220 }}>{item.description || '-'}</td>
              <td>{item.channel || '-'}</td>
              <td>{item.triggerType || '-'}</td>
              <td>{formatDate(item.scheduledAt)}</td>
              <td className="mono">{item.cronExpression || '-'}</td>
            </tr>
          ))}

          {!loading && !schedules.length && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                No schedules found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function filterSchedules(items: Schedule[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter(item => {
    return [
      item.id,
      item.eventName,
      item.description,
      item.channel,
      item.triggerType,
      item.cronExpression,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <SchedulesApp />
      </ModalProvider>
    </Provider>
  </React.StrictMode>,
);
