import React, { useEffect, useState } from 'react';
import { Edit3, RefreshCw, Search, Trash2, Zap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteRegisteredEvent, fetchRegisteredEvents, updateRegisteredEvent } from '../../store/slices/eventsSlices';
import type { RegisteredEvent, EventType } from '../../types';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f59e0b', 3: '#facc15', 4: '#22c55e', 5: '#94a3b8',
};

function PriorityBadge({ p }: { p: number }) {
  return (
    <span className="priority-dot" style={{ color: PRIORITY_COLORS[p] ?? '#94a3b8' }}>
      {'●'.repeat(p)}{'○'.repeat(5 - p)}
      <span style={{ color: '#94a3b8', marginLeft: 4 }}>P{p}</span>
    </span>
  );
}

export function RegisteredEventsTable() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector(s => s.registeredEvents);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventType | 'ALL'>('ALL');
  const [editing, setEditing] = useState<RegisteredEvent | null>(null);

  useEffect(() => { dispatch(fetchRegisteredEvents()); }, [dispatch]);

  const filtered = items.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || e.eventType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><Zap size={15} /> Registered Events</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 12, color: '#475569' }}>{filtered.length} events</span><button className="btn-icon" title="Refresh registered events" onClick={() => dispatch(fetchRegisteredEvents())}><RefreshCw size={14} /></button></div>
      </div>

      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="filter-bar">
          <div className="search-input">
            <Search size={14} />
            <input
              placeholder="Search events…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {(['ALL', 'DOMAIN', 'SYSTEM', 'SCHEDULED', 'WEBHOOK'] as const).map(t => (
            <button
              key={t}
              className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '5px 12px', fontSize: 12 }}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        {loading && !items.length ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />
            ))}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Description</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Schedule Intent</th>
                <th>Preferred Window</th>
                <th>Registered On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <RegisteredEventRow key={e.id} event={e} onEdit={() => setEditing(e)} onDelete={() => { if (confirm(`Delete ${e.name}?`)) void dispatch(deleteRegisteredEvent(e.id)); }} />
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                    No events match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {editing && <EventEditor event={editing} onClose={() => setEditing(null)} onSave={event => { void dispatch(updateRegisteredEvent({ id: event.id, event })); setEditing(null); }} />}
    </div>
  );
}

function RegisteredEventRow({ event: e, onEdit, onDelete }: { event: RegisteredEvent; onEdit: () => void; onDelete: () => void }) {
  const typeClass = 'badge badge-active';

  return (
    <>
      <tr>
        <td>
          <span className="mono" style={{ color: '#fde047' }}>{e.name}</span>
        </td>
        <td style={{ maxWidth: 240 }}>{e.description || '—'}</td>
        <td><span className={typeClass}>{e.eventType}</span></td>
        <td><PriorityBadge p={e.priority} /></td>
        <td>{e.scheduleIntent || '—'}</td><td>{e.preferredTimeWindow || '—'}</td>
        <td style={{ color: '#475569' }}>{e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}</td>
        <td><div style={{ display: 'flex', gap: 4 }}><button className="btn-icon" title="Update event" onClick={onEdit}><Edit3 size={14} /></button><button className="btn-icon" title="Delete event" style={{ color: '#ef4444' }} onClick={onDelete}><Trash2 size={14} /></button></div></td>
      </tr>
    </>
  );
}

function EventEditor({ event, onClose, onSave }: { event: RegisteredEvent; onClose: () => void; onSave: (event: RegisteredEvent) => void }) {
  const [draft, setDraft] = useState(event);
  const field = (key: keyof RegisteredEvent, label: string) => <label className="form-group"><span className="form-label">{label}</span><input className="form-input" value={String(draft[key] ?? '')} onChange={e => setDraft({ ...draft, [key]: key === 'priority' ? Number(e.target.value) : e.target.value })} /></label>;
  return <div className="modal-overlay"><div className="modal-box"><div className="modal-header"><span className="modal-title">Update event</span></div><div className="modal-body" style={{ display: 'grid', gap: 12 }}>{field('name', 'Event name')}{field('description', 'Description')}{field('priority', 'Priority')}{field('eventType', 'Type')}{field('scheduleIntent', 'Schedule intent')}{field('preferredTimeWindow', 'Preferred time window')}</div><div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave(draft)}>Save</button></div></div></div>;
}
