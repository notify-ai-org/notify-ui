import React, { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Skull,
  Trash2,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { PortalSidebar } from '@notify-ui/shared';
import type { AppDispatch, RootState } from './store';
import { discardEntry, fetchDLQ, retryEntry, setDLQPage } from './store/slices/dlqSlice';
import type { DLQStatus, DeadLetterEntry } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(selector: (state: RootState) => T) => useSelector<RootState, T>(selector);

const configuredBase = import.meta.env.VITE_PORTAL_BASE;
const defaultBase =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/portals/dead-letters')
    ? '/portals/dead-letters/'
    : '/';
const BASE =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? undefined
    : configuredBase ?? defaultBase;

const STATUS_COLOR: Record<DLQStatus, string> = {
  PENDING: '#f59e0b',
  REPLAYED: '#22c55e',
  DISCARDED: '#ef4444',
};

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <PortalSidebar />
        <header className="topbar">
          <div>
            <div className="topbar-title">Dead Letter Queue</div>
            <div className="topbar-subtitle">Failed events awaiting retry or discard</div>
          </div>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/*" element={<DLQTable />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function DLQTable() {
  const dispatch = useD();
  const { items, loading, page, totalPages, retrying } = useS(state => state.dlq) as {
    items: DeadLetterEntry[];
    loading: boolean;
    page: number;
    totalPages: number;
    retrying: number[];
  };
  const [statusFilter, setStatusFilter] = useState<DLQStatus | 'ALL'>('ALL');
  const [viewEntry, setViewEntry] = useState<DeadLetterEntry | null>(null);

  useEffect(() => {
    dispatch(fetchDLQ({ page, status: statusFilter === 'ALL' ? '' : statusFilter }));
  }, [dispatch, page, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <StatsBar items={items} page={page} totalPages={totalPages} />

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Skull size={15} /> Dead Letter Queue
          </span>
          <StatusFilters statusFilter={statusFilter} onChange={setStatusFilter} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <SkeletonRows />
          ) : (
            <DeadLetterTable
              items={items}
              retrying={retrying}
              onView={setViewEntry}
              onRetry={id => dispatch(retryEntry(id))}
              onDiscard={id => {
                if (confirm('Discard this entry?')) dispatch(discardEntry(id));
              }}
            />
          )}
        </div>

        <Pager page={page} total={totalPages} onChange={nextPage => dispatch(setDLQPage(nextPage))} />
      </div>

      {viewEntry && <PayloadModal entry={viewEntry} onClose={() => setViewEntry(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function StatsBar({
  items,
  page,
  totalPages,
}: {
  items: DeadLetterEntry[];
  page: number;
  totalPages: number;
}) {
  const pending = items.filter(entry => entry.replayStatus === 'PENDING').length;
  const discarded = items.filter(entry => entry.replayStatus === 'DISCARDED').length;
  const stats = [
    { label: 'Total Entries', value: items.length, color: '#94a3b8' },
    { label: 'Pending', value: pending, color: '#f59e0b' },
    { label: 'Discarded', value: discarded, color: '#ef4444' },
    { label: 'Page', value: `${page + 1} / ${totalPages}`, color: '#facc15' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {stats.map(stat => (
        <div key={stat.label} className="card" style={{ padding: '14px 18px' }}>
          <div style={{ color: stat.color, fontWeight: 700, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>
            {stat.value}
          </div>
          <div
            style={{
              color: '#475569',
              fontSize: 11,
              marginTop: 2,
              fontWeight: 500,
              textTransform: 'uppercase',
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusFilters({
  statusFilter,
  onChange,
}: {
  statusFilter: DLQStatus | 'ALL';
  onChange: (status: DLQStatus | 'ALL') => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {(['ALL', 'PENDING', 'REPLAYED', 'DISCARDED'] as const).map(status => (
        <button
          key={status}
          className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '5px 10px', fontSize: 11 }}
          onClick={() => onChange(status)}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

function SkeletonRows() {
  return (
    <div style={{ padding: 24 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton" style={{ height: 44, marginBottom: 8, borderRadius: 6 }} />
      ))}
    </div>
  );
}

function DeadLetterTable({
  items,
  retrying,
  onView,
  onRetry,
  onDiscard,
}: {
  items: DeadLetterEntry[];
  retrying: number[];
  onView: (entry: DeadLetterEntry) => void;
  onRetry: (id: number) => void;
  onDiscard: (id: number) => void;
}) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Notification</th>
          <th>Channel</th>
          <th>Target</th>
          <th>Failure</th>
          <th>Attempts</th>
          <th>Status</th>
          <th>Created</th>
          <th>Last Attempt</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.map(entry => (
          <DeadLetterRow
            key={entry.id}
            entry={entry}
            retrying={retrying.includes(entry.id)}
            onView={onView}
            onRetry={onRetry}
            onDiscard={onDiscard}
          />
        ))}

        {!items.length && (
          <tr>
            <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
              Dead letter queue is empty.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function DeadLetterRow({
  entry,
  retrying,
  onView,
  onRetry,
  onDiscard,
}: {
  entry: DeadLetterEntry;
  retrying: boolean;
  onView: (entry: DeadLetterEntry) => void;
  onRetry: (id: number) => void;
  onDiscard: (id: number) => void;
}) {
  const canAct = entry.replayStatus === 'PENDING';

  return (
    <tr>
      <td><span className="mono" style={{ color: '#ef4444' }}>{entry.notificationId}</span></td>
      <td><span className="mono" style={{ color: '#94a3b8', fontSize: 11 }}>{entry.channel}</span></td>
      <td><span style={{ color: '#94a3b8', fontSize: 12 }}>{entry.target || '-'}</span></td>
      <td style={{ maxWidth: 200 }}>
        <span
          style={{
            color: '#f87171',
            fontSize: 12,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          [{entry.failureReasonCode}] {entry.failureMessage ?? entry.failureCategory}
        </span>
      </td>
      <td style={{ textAlign: 'center' }}><span style={{ color: '#94a3b8' }}>{entry.attemptCount}</span></td>
      <td>
        <span
          className="badge"
          style={{
            background: `${STATUS_COLOR[entry.replayStatus]}22`,
            color: STATUS_COLOR[entry.replayStatus],
          }}
        >
          {entry.replayStatus}
        </span>
      </td>
      <td style={{ color: '#475569' }}>{formatTimestamp(entry.createdAt)}</td>
      <td style={{ color: '#334155' }}>{formatTimestamp(entry.lastAttemptAt)}</td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-icon" title="View payload" onClick={() => onView(entry)}>
            <Eye size={13} />
          </button>
          <button
            className="btn-icon"
            title="Replay"
            disabled={retrying || !canAct}
            style={{ color: retrying ? '#8d855f' : '#facc15' }}
            onClick={() => onRetry(entry.id)}
          >
            <RefreshCw size={13} style={retrying ? { animation: 'spin 1s linear infinite' } : {}} />
          </button>
          <button
            className="btn-icon"
            title="Discard"
            disabled={!canAct}
            style={{ color: canAct ? '#ef4444' : '#334155' }}
            onClick={() => onDiscard(entry.id)}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Pager({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} />
      </button>
      {Array.from({ length: Math.min(total, 5) }).map((_, index) => {
        const nextPage = total <= 5 ? index : Math.max(0, page - 2) + index;
        return (
          <button
            key={nextPage}
            className={`page-btn${nextPage === page ? ' active' : ''}`}
            onClick={() => onChange(nextPage)}
          >
            {nextPage + 1}
          </button>
        );
      })}
      <button className="page-btn" disabled={page === total - 1} onClick={() => onChange(page + 1)}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

function PayloadModal({ entry, onClose }: { entry: DeadLetterEntry; onClose: () => void }) {
  const payload = parsePayload(entry.originalJobPayload);

  return (
    <div className="modal-overlay" onClick={event => event.target === event.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 600 }}>
        <div className="modal-header">
          <span className="modal-title">
            Payload - <span className="mono" style={{ color: '#ef4444', fontSize: 13 }}>{entry.notificationId}</span>
          </span>
          <button className="btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Error</div>
            <div
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#ef4444',
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              [{entry.failureReasonCode}] {entry.failureMessage ?? 'No failure message'}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Payload</div>
            <pre
              style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 8,
                padding: 14,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: '#94a3b8',
                overflowX: 'auto',
                margin: 0,
                maxHeight: 360,
              }}
            >
              {typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) return '-';
  return format(parseISO(value), 'MMM d HH:mm');
}

function parsePayload(value: string | null) {
  if (!value) return {};

  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return value;
  }
}
