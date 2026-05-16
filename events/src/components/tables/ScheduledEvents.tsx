import React, { useEffect, useState } from 'react';
import { Calendar, Edit2, Pause, Play, X, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchScheduledEvents, updateSchedule, toggleScheduleStatus, optimisticToggle,
} from '../../store/slices/eventsSlices';
import type { ScheduledEvent, ScheduleConfig } from '../../types';

export function ScheduledEventsTable() {
  const dispatch = useAppDispatch();
  const { items, loading, saving } = useAppSelector(s => s.scheduledEvents);
  const [editing, setEditing] = useState<ScheduledEvent | null>(null);

  useEffect(() => { dispatch(fetchScheduledEvents()); }, [dispatch]);

  const handleToggle = (e: ScheduledEvent) => {
    const pause = e.status === 'RUNNING';
    dispatch(optimisticToggle({ id: e.id, status: pause ? 'PAUSED' : 'RUNNING' }));
    dispatch(toggleScheduleStatus({ id: e.id, pause }));
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Calendar size={15} /> Scheduled Events</span>
          <span style={{ fontSize: 12, color: '#475569' }}>{items.length} schedules</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading && !items.length ? (
            <div style={{ padding: 24 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />
              ))}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Key</th>
                  <th>Status</th>
                  <th>Cron</th>
                  <th>Timezone</th>
                  <th>Last Run</th>
                  <th>Next Run</th>
                  <th>Success / Fail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(e => (
                  <ScheduledRow
                    key={e.id}
                    event={e}
                    onEdit={() => setEditing(e)}
                    onToggle={() => handleToggle(e)}
                  />
                ))}
                {!items.length && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                      No scheduled events found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editing && (
        <EditScheduleModal
          event={editing}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={(cfg) => {
            dispatch(updateSchedule({ id: editing.id, schedule: cfg }));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function ScheduledRow({
  event: e, onEdit, onToggle,
}: { event: ScheduledEvent; onEdit: () => void; onToggle: () => void }) {
  const statusClass = `badge badge-${e.status.toLowerCase()}`;
  const isPausable = e.status === 'RUNNING' || e.status === 'PAUSED';

  return (
    <tr>
      <td><span className="mono" style={{ color: '#818cf8' }}>{e.eventKey}</span></td>
      <td><span className={statusClass}>{e.status}</span></td>
      <td><span className="mono">{e.schedule.cronExpression}</span></td>
      <td style={{ color: '#94a3b8' }}>{e.schedule.timezone}</td>
      <td style={{ color: '#475569' }}>
        {e.lastRunAt ? format(parseISO(e.lastRunAt), 'MMM d, HH:mm') : '—'}
      </td>
      <td style={{ color: '#94a3b8' }}>
        {e.nextRunAt ? format(parseISO(e.nextRunAt), 'MMM d, HH:mm') : '—'}
      </td>
      <td>
        <span style={{ color: '#22c55e' }}>{e.successCount}</span>
        <span style={{ color: '#475569', margin: '0 4px' }}>/</span>
        <span style={{ color: '#ef4444' }}>{e.failureCount}</span>
      </td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-icon" title="Edit schedule" onClick={onEdit}>
            <Edit2 size={14} />
          </button>
          {isPausable && (
            <button
              className="btn-icon"
              title={e.status === 'RUNNING' ? 'Pause' : 'Resume'}
              onClick={onToggle}
            >
              {e.status === 'RUNNING' ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function EditScheduleModal({
  event, saving, onClose, onSave,
}: {
  event: ScheduledEvent;
  saving: boolean;
  onClose: () => void;
  onSave: (cfg: ScheduleConfig) => void;
}) {
  const [cfg, setCfg] = useState<ScheduleConfig>({ ...event.schedule });

  const field = (k: keyof ScheduleConfig) => (
    <div className="form-group" key={k}>
      <label className="form-label">{k}</label>
      <input
        className="form-input"
        value={String(cfg[k])}
        onChange={e => setCfg(prev => ({
          ...prev,
          [k]: k.endsWith('Ms') || k === 'maxRetries'
            ? Number(e.target.value)
            : e.target.value,
        }))}
      />
    </div>
  );

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Edit Schedule — <span className="mono" style={{ color: '#818cf8', fontSize: 13 }}>{event.eventKey}</span></span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {(['cronExpression', 'timezone', 'maxRetries', 'retryDelayMs'] as const).map(field)}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={() => onSave(cfg)}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
