import React, { useEffect, useMemo } from 'react';
import { Calendar, Clock3, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchScheduledEvents } from '../../store/slices/eventsSlices';
import type { ScheduledEvent } from '../../types';

export function ScheduledEventsTable() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector(state => state.scheduledEvents);

  useEffect(() => {
    dispatch(fetchScheduledEvents());
  }, [dispatch]);

  const scheduledEvents = useMemo(
    () => [...items].sort((a, b) => dateValue(a.fireTime) - dateValue(b.fireTime)),
    [items],
  );

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Calendar size={15} /> Scheduled Events
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#475569' }}>{scheduledEvents.length} next 24h</span>
          <button
            className="btn-icon"
            title="Refresh scheduled events"
            onClick={() => dispatch(fetchScheduledEvents({ forceRefresh: true }))}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        {loading && !items.length ? (
          <ScheduledSkeletonRows />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Fire Time</th>
                <th>Event Name</th>
                <th>Channel</th>
                <th>Trigger</th>
                <th>Cron</th>
                <th>Schedule ID</th>
                <th>Job ID</th>
              </tr>
            </thead>
            <tbody>
              {scheduledEvents.map(event => (
                <ScheduledEventRow key={event.id} event={event} />
              ))}

              {!scheduledEvents.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                    {error || 'No scheduled events in the next 24 hours'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ScheduledEventRow({ event }: { event: ScheduledEvent }) {
  return (
    <tr>
      <td>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Clock3 size={13} />
          {formatDateTime(event.fireTime)}
        </span>
      </td>
      <td>
        <span className="mono" style={{ color: '#fde047' }}>{event.eventName || '-'}</span>
      </td>
      <td><span className="badge badge-active">{event.channel || '-'}</span></td>
      <td>{event.triggerType || '-'}</td>
      <td className="mono">{event.cronExpression || '-'}</td>
      <td className="mono">{event.scheduleId || '-'}</td>
      <td className="mono">{event.jobId || '-'}</td>
    </tr>
  );
}

function ScheduledSkeletonRows() {
  return (
    <div style={{ padding: 24 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />
      ))}
    </div>
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function dateValue(value: string | null | undefined) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}
