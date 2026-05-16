import React, { useEffect, useState } from 'react';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCaptureLog, setCaptureLogPage } from '../../store/slices/eventsSlices';

export function CaptureLog() {
  const dispatch = useAppDispatch();
  const { entries, loading, page, totalPages } = useAppSelector(s => s.captureLog);

  useEffect(() => { dispatch(fetchCaptureLog(page)); }, [dispatch, page]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <FileText size={15} />
          Event Capture Log
          <span className="live-dot" style={{ marginLeft: 4 }} />
        </span>
        <span style={{ fontSize: 12, color: '#475569' }}>Page {page + 1} / {totalPages}</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 36, marginBottom: 6, borderRadius: 6 }} />
            ))}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Key</th>
                <th>Tenant</th>
                <th>Captured At</th>
                <th>Processing</th>
                <th>Rules Fired</th>
                <th>Notifications</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td><span className="mono" style={{ color: '#818cf8' }}>{e.eventKey}</span></td>
                  <td><span className="mono" style={{ fontSize: 11, color: '#475569' }}>{e.tenantId}</span></td>
                  <td style={{ color: '#94a3b8' }}>
                    {format(parseISO(e.capturedAt), 'MMM d HH:mm:ss')}
                  </td>
                  <td>
                    <span style={{
                      color: e.processingTimeMs > 500 ? '#f59e0b' : '#22c55e',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                    }}>
                      {e.processingTimeMs}ms
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{e.rulesFired}</td>
                  <td style={{ textAlign: 'center' }}>{e.notificationsSent}</td>
                  <td>
                    <span className={`badge badge-${e.status.toLowerCase()}`}>{e.status}</span>
                  </td>
                </tr>
              ))}
              {!entries.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                    No capture log entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={p => dispatch(setCaptureLogPage(p))}
      />
    </div>
  );
}

// ─── Notification Log ─────────────────────────────────────────────────────────

import { Bell } from 'lucide-react';
import { fetchNotificationLog, setNotifLogPage } from '../../store/slices/eventsSlices';

export function NotificationLog() {
  const dispatch = useAppDispatch();
  const { entries, loading, page, totalPages } = useAppSelector(s => s.notificationLog);

  useEffect(() => { dispatch(fetchNotificationLog(page)); }, [dispatch, page]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Bell size={15} />
          Notification Log
          <span className="live-dot" style={{ marginLeft: 4 }} />
        </span>
        <span style={{ fontSize: 12, color: '#475569' }}>Page {page + 1} / {totalPages}</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 36, marginBottom: 6, borderRadius: 6 }} />
            ))}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Key</th>
                <th>Channel</th>
                <th>Recipient</th>
                <th>Template</th>
                <th>Sent At</th>
                <th>Retries</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td><span className="mono" style={{ color: '#818cf8' }}>{e.eventKey}</span></td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                      {e.channel}
                    </span>
                  </td>
                  <td className="mono" style={{ color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.recipient}
                  </td>
                  <td><span className="mono" style={{ fontSize: 11 }}>{e.templateId}</span></td>
                  <td style={{ color: '#94a3b8' }}>
                    {format(parseISO(e.sentAt), 'MMM d HH:mm:ss')}
                  </td>
                  <td style={{ textAlign: 'center', color: e.retryCount > 0 ? '#f59e0b' : '#475569' }}>
                    {e.retryCount}
                  </td>
                  <td>
                    <span className={`badge badge-${e.deliveryStatus.toLowerCase()}`}>{e.deliveryStatus}</span>
                  </td>
                </tr>
              ))}
              {!entries.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                    No notification log entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={p => dispatch(setNotifLogPage(p))}
      />
    </div>
  );
}

// ─── Shared Pagination ────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i;
    if (page < 4) return i;
    if (page > totalPages - 4) return totalPages - 7 + i;
    return page - 3 + i;
  });

  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={14} />
      </button>
      {pages.map(p => (
        <button
          key={p}
          className={`page-btn${p === page ? ' active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button className="page-btn" disabled={page === totalPages - 1} onClick={() => onChange(page + 1)}>
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
