import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ClipboardList, Eye, RefreshCw, X } from 'lucide-react';
import {
  ModalProvider,
  PortalSidebar,
  ProfileMenu,
  createSharedStore,
  httpService,
  initApiConfig,
  registerErrorHandlerStore,
  registerHttpServiceStore,
} from '@notify-ui/shared';
import '../../events/src/styles/global.css';

type LogKind = 'capture' | 'notifications';
type PagedResponse = { content: Array<Record<string, unknown>>; totalPages: number };
type LogColumn = { key: string; label: string };

initApiConfig({
  baseURL: '',
  getAccessToken: () => document.cookie.match(/notify_access_token=([^;]+)/)?.[1] ?? null,
});

const store = createSharedStore();
registerHttpServiceStore(store);
registerErrorHandlerStore(store);

function LogsApp() {
  const [kind, setKind] = useState<LogKind>('capture');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PagedResponse>({ content: [], totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await httpService.get<PagedResponse>(`/api/admin/data/logs/${kind}`, {
        params: { page, size: 20, sort: 'timestamp,desc' },
        ttlMs: 0,
      });
      setData({
        content: next.content ?? [],
        totalPages: next.totalPages ?? 1,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load log records.');
      setData({ content: [], totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [kind]);

  useEffect(() => {
    void load();
  }, [kind, page]);

  return (
    <div className="app-shell">
      <PortalSidebar />
      <header className="topbar">
        <div>
          <div className="topbar-title">Logs</div>
          <div className="topbar-subtitle">Event capture and notification delivery records</div>
        </div>
        <div className="topbar-actions">
          <button className="btn-icon" title="Refresh logs" onClick={() => void load()}>
            <RefreshCw size={15} />
          </button>
          <ProfileMenu />
        </div>
      </header>

      <main className="main-content">
        <section className="card">
          <div className="card-header">
            <span className="card-title">
              <ClipboardList size={15} /> Delivery activity
            </span>
            <LogTabs kind={kind} onChange={setKind} />
          </div>
          {error && <div className="form-error" style={{ margin: 14 }}>{error}</div>}
          <LogTable kind={kind} rows={data.content} loading={loading} error={error} />
          <Pagination page={page} totalPages={data.totalPages} onChange={setPage} />
        </section>
      </main>
    </div>
  );
}

function LogTabs({
  kind,
  onChange,
}: {
  kind: LogKind;
  onChange: (kind: LogKind) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className={`btn ${kind === 'capture' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onChange('capture')}
      >
        Event Capture Logs
      </button>
      <button
        className={`btn ${kind === 'notifications' ? 'btn-primary' : 'btn-ghost'}`}
        onClick={() => onChange('notifications')}
      >
        Notification Logs
      </button>
    </div>
  );
}

function LogTable({
  kind,
  rows,
  loading,
  error,
}: {
  kind: LogKind;
  rows: Array<Record<string, unknown>>;
  loading: boolean;
  error: string | null;
}) {
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const columns = useMemo(() => getColumns(kind, rows), [kind, rows]);

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(column => (
                <th key={column.key}>{column.label}</th>
              ))}
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={String(row.id ?? index)}>
                {columns.map(column => (
                  <td key={column.key}>{displayValue(row[column.key])}</td>
                ))}
                <td>
                  <button
                    className="btn-icon"
                    title="View event details"
                    onClick={() => setSelected(row)}
                  >
                    <Eye size={13} />
                  </button>
                </td>
              </tr>
            ))}

            {!loading && !error && !rows.length && (
              <tr>
                <td
                  colSpan={Math.max(columns.length + 1, 1)}
                  style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}
                >
                  No log records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <LogDetailsModal row={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 14 }}>
      <button className="btn btn-ghost" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span style={{ padding: '7px 0', color: 'var(--text-muted)' }}>Page {page + 1}</span>
      <button
        className="btn btn-ghost"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function LogDetailsModal({
  row,
  onClose,
}: {
  row: Record<string, unknown>;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 760 }}
        onClick={event => event.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">Event details</span>
          <button className="btn-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 12, maxHeight: '70vh', overflow: 'auto' }}>
          {Object.entries(row).map(([key, value]) => (
            <DetailBlock key={key} label={formatColumnLabel(key)} value={value} />
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }: { label: string; value: unknown }) {
  if (isPlainObject(value)) {
    return (
      <div>
        <div className="form-label">{label}</div>
        <div
          style={{
            border: '1px solid var(--border)',
            padding: 12,
            background: 'rgba(255,255,255,0.02)',
            display: 'grid',
            gap: 8,
          }}
        >
          {Object.entries(value).map(([key, child]) => (
            <DetailBlock key={key} label={key} value={child} />
          ))}
        </div>
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <div className="form-label">{label}</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {value.length ? (
            value.map((item, index) => (
              <DetailBlock key={index} label={`Item ${index + 1}`} value={item} />
            ))
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Empty</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="form-label">{label}</div>
      <div style={{ color: '#d0c9a8', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
        {displayValue(value)}
      </div>
    </div>
  );
}

function getColumns(kind: LogKind, rows: Array<Record<string, unknown>>): LogColumn[] {
  if (kind === 'notifications') {
    return [
      { key: 'notificationJobId', label: 'Notification Job ID' },
      { key: 'eventName', label: 'Event Name' },
      { key: 'channel', label: 'Channel' },
      { key: 'status', label: 'Status' },
      { key: 'error', label: 'Error' },
    ];
  }

  if (!rows.length) {
    return [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'eventName', label: 'Event Name' },
      { key: 'eventType', label: 'Event Type' },
      { key: 'status', label: 'Status' },
      { key: 'serviceName', label: 'Service Name' },
      { key: 'durationMillis', label: 'Duration Millis' },
      { key: 'success', label: 'Success' },
      { key: 'error', label: 'Error' },
    ];
  }

  const hidden = new Set(['details', 'payload', 'headers', 'correlationId', 'processingStatus', 'tenantId']);
  return rows.length
    ? Object.keys(rows[0])
      .filter(key => !hidden.has(key))
      .slice(0, 8)
      .map(key => ({ key, label: formatColumnLabel(key) }))
    : [];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function formatColumnLabel(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .replace(/\bId\b/g, 'ID');
}

function displayValue(value: unknown) {
  if (value == null || value === '') return '-';
  return typeof value === 'object' ? 'View details' : String(value);
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <LogsApp />
      </ModalProvider>
    </Provider>
  </React.StrictMode>,
);
