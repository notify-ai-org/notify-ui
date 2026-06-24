import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Skull, RefreshCw, Trash2, ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import { PortalSidebar } from '@notify-ui/shared';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { fetchDLQ, retryEntry, discardEntry, setDLQPage } from './store/slices/dlqSlice';
import type { DeadLetterEntry, DLQStatus } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(fn: (s: RootState) => T) => useSelector<RootState, T>(fn);
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
  PENDING: '#f59e0b', RETRYING: '#facc15', DISCARDED: '#ef4444', RESOLVED: '#22c55e',
};

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

function PayloadModal({ entry, onClose }: { entry: DeadLetterEntry; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 600 }}>
        <div className="modal-header">
          <span className="modal-title">Payload — <span className="mono" style={{ color: '#ef4444', fontSize: 13 }}>{entry.eventKey}</span></span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: 12 }}>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Error</div>
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
              [{entry.errorCode}] {entry.errorMessage}
            </div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Payload</div>
            <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#94a3b8', overflowX: 'auto', margin: 0, maxHeight: 360 }}>
              {JSON.stringify(entry.payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function DLQTable() {
  const dispatch = useD();
  const { items, loading, page, totalPages, retrying } = useS(s => (s as any).dlq) as any;
  const [statusFilter, setStatusFilter] = useState<DLQStatus | 'ALL'>('ALL');
  const [viewEntry, setViewEntry] = useState<DeadLetterEntry | null>(null);

  useEffect(() => { dispatch(fetchDLQ({ page, status: statusFilter === 'ALL' ? '' : statusFilter })); }, [dispatch, page, statusFilter]);

  const isRetrying = (id: string) => (retrying as string[]).includes(id);

  const pending = (items as DeadLetterEntry[]).filter(e => e.status === 'PENDING').length;
  const failed = (items as DeadLetterEntry[]).filter(e => e.retryCount >= e.maxRetries).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Total Entries', value: items.length, color: '#94a3b8' },
          { label: 'Pending', value: pending, color: '#f59e0b' },
          { label: 'Max Retries Hit', value: failed, color: '#ef4444' },
          { label: 'Page', value: `${page + 1} / ${totalPages}`, color: '#facc15' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><Skull size={15} /> Dead Letter Queue</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['ALL', 'PENDING', 'RETRYING', 'DISCARDED', 'RESOLVED'] as const).map(s => (
              <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setStatusFilter(s)}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? <div style={{ padding: 24 }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8, borderRadius: 6 }} />)}</div> : (
            <table className="data-table">
              <thead><tr><th>Event</th><th>Tenant</th><th>Error</th><th>Retries</th><th>Status</th><th>Failed At</th><th>Last Retry</th><th>Actions</th></tr></thead>
              <tbody>
                {(items as DeadLetterEntry[]).map((e) => (
                  <tr key={e.id}>
                    <td><span className="mono" style={{ color: '#ef4444' }}>{e.eventKey}</span></td>
                    <td><span className="mono" style={{ color: '#94a3b8', fontSize: 11 }}>{e.tenantId}</span></td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ color: '#f87171', fontSize: 12, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        [{e.errorCode}] {e.errorMessage}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: e.retryCount >= e.maxRetries ? '#ef4444' : '#94a3b8' }}>
                        {e.retryCount}/{e.maxRetries}
                      </span>
                    </td>
                    <td><span className="badge" style={{ background: `${STATUS_COLOR[e.status]}22`, color: STATUS_COLOR[e.status] }}>{e.status}</span></td>
                    <td style={{ color: '#475569' }}>{format(parseISO(e.failedAt), 'MMM d HH:mm')}</td>
                    <td style={{ color: '#334155' }}>{e.lastRetryAt ? format(parseISO(e.lastRetryAt), 'MMM d HH:mm') : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" title="View payload" onClick={() => setViewEntry(e)}><Eye size={13} /></button>
                        <button className="btn-icon" title="Retry" disabled={isRetrying(e.id) || e.status === 'DISCARDED' || e.status === 'RESOLVED'}
                          style={{ color: isRetrying(e.id) ? '#8d855f' : '#facc15' }}
                          onClick={() => dispatch(retryEntry(e.id))}>
                          <RefreshCw size={13} style={isRetrying(e.id) ? { animation: 'spin 1s linear infinite' } : {}} />
                        </button>
                        <button className="btn-icon" title="Discard" disabled={e.status === 'DISCARDED'} style={{ color: e.status === 'DISCARDED' ? '#334155' : '#ef4444' }}
                          onClick={() => { if (confirm('Discard this entry?')) dispatch(discardEntry(e.id)); }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>Dead letter queue is empty 🎉</td></tr>}
              </tbody>
            </table>
          )}
        </div>
        <Pager page={page} total={totalPages} onChange={p => dispatch(setDLQPage(p))} />
      </div>

      {viewEntry && <PayloadModal entry={viewEntry} onClose={() => setViewEntry(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <PortalSidebar />
        <header className="topbar">
          <div><div className="topbar-title">Dead Letter Queue</div><div className="topbar-subtitle">Failed events awaiting retry or discard</div></div>
        </header>
        <main className="main-content">
          <Routes><Route path="/*" element={<DLQTable />} /></Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
