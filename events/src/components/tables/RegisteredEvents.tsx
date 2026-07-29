import React, { useEffect, useMemo, useState } from 'react';
import { Edit3, RefreshCw, Search, Trash2, Zap } from 'lucide-react';
import { PaginationControls } from '@notify-ui/shared';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  deleteRegisteredEvent,
  fetchRegisteredEvents,
  updateRegisteredEvent,
} from '../../store/slices/eventsSlices';
import type { EventType, RegisteredEvent } from '../../types';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#facc15',
  4: '#22c55e',
  5: '#94a3b8',
};

const EVENT_TYPE_FILTERS = ['ALL', 'DOMAIN', 'SYSTEM', 'SCHEDULED', 'WEBHOOK'] as const;

type EventTypeFilter = typeof EVENT_TYPE_FILTERS[number];

export function RegisteredEventsTable() {
  const dispatch = useAppDispatch();
  const { items, loading, page, totalPages } = useAppSelector(state => state.registeredEvents);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>('ALL');
  const [editing, setEditing] = useState<RegisteredEvent | null>(null);

  useEffect(() => {
    dispatch(fetchRegisteredEvents());
  }, [dispatch]);

  const filtered = useMemo(() => {
    return filterEvents(items, search, typeFilter);
  }, [items, search, typeFilter]);

  const deleteEvent = (event: RegisteredEvent) => {
    if (confirm(`Delete ${event.name}?`)) {
      void dispatch(deleteRegisteredEvent(event.id));
    }
  };

  const saveEvent = (event: RegisteredEvent) => {
    void dispatch(updateRegisteredEvent({ id: event.id, event }));
    setEditing(null);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Zap size={15} /> Registered Events
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#475569' }}>{filtered.length} events</span>
          <button
            className="btn-icon"
            title="Refresh registered events"
            onClick={() => dispatch(fetchRegisteredEvents(page))}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      <EventFilters
        search={search}
        typeFilter={typeFilter}
        onSearchChange={setSearch}
        onTypeChange={setTypeFilter}
      />

      <div style={{ overflowX: 'auto' }}>
        {loading && !items.length ? (
          <SkeletonRows />
        ) : (
          <EventsTable
            events={filtered}
            onEdit={setEditing}
            onDelete={deleteEvent}
          />
        )}
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        disabled={loading}
        onChange={nextPage => dispatch(fetchRegisteredEvents(nextPage))}
      />

      {editing && (
        <EventEditor
          event={editing}
          onClose={() => setEditing(null)}
          onSave={saveEvent}
        />
      )}
    </div>
  );
}

function EventFilters({
  search,
  typeFilter,
  onSearchChange,
  onTypeChange,
}: {
  search: string;
  typeFilter: EventTypeFilter;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: EventTypeFilter) => void;
}) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="filter-bar">
        <div className="search-input">
          <Search size={14} />
          <input
            placeholder="Search events..."
            value={search}
            onChange={event => onSearchChange(event.target.value)}
          />
        </div>
        {EVENT_TYPE_FILTERS.map(type => (
          <button
            key={type}
            className={`btn ${typeFilter === type ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '5px 12px', fontSize: 12 }}
            onClick={() => onTypeChange(type)}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div style={{ padding: 24 }}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />
      ))}
    </div>
  );
}

function EventsTable({
  events,
  onEdit,
  onDelete,
}: {
  events: RegisteredEvent[];
  onEdit: (event: RegisteredEvent) => void;
  onDelete: (event: RegisteredEvent) => void;
}) {
  return (
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
        {events.map(event => (
          <RegisteredEventRow
            key={event.id}
            event={event}
            onEdit={() => onEdit(event)}
            onDelete={() => onDelete(event)}
          />
        ))}

        {!events.length && (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
              No events match the current filters
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function RegisteredEventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: RegisteredEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr>
      <td>
        <span className="mono" style={{ color: '#fde047' }}>{event.name}</span>
      </td>
      <td style={{ maxWidth: 240 }}>{event.description || '-'}</td>
      <td><span className="badge badge-active">{event.eventType}</span></td>
      <td><PriorityBadge priority={event.priority} /></td>
      <td>{event.scheduleIntent || '-'}</td>
      <td>{event.preferredTimeWindow || '-'}</td>
      <td style={{ color: '#475569' }}>
        {event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn-icon" title="Update event" onClick={onEdit}>
            <Edit3 size={14} />
          </button>
          <button
            className="btn-icon"
            title="Delete event"
            style={{ color: '#ef4444' }}
            onClick={onDelete}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  return (
    <span className="priority-dot" style={{ color: PRIORITY_COLORS[priority] ?? '#94a3b8' }}>
      {'●'.repeat(priority)}{'○'.repeat(5 - priority)}
      <span style={{ color: '#94a3b8', marginLeft: 4 }}>P{priority}</span>
    </span>
  );
}

function EventEditor({
  event,
  onClose,
  onSave,
}: {
  event: RegisteredEvent;
  onClose: () => void;
  onSave: (event: RegisteredEvent) => void;
}) {
  const [draft, setDraft] = useState(event);

  const setField = (key: keyof RegisteredEvent, value: string) => {
    setDraft({
      ...draft,
      [key]: key === 'priority' ? Number(value) : value,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Update event</span>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
          <EventField label="Event name" value={draft.name} onChange={value => setField('name', value)} />
          <EventField label="Description" value={draft.description} onChange={value => setField('description', value)} />
          <EventField label="Priority" value={String(draft.priority)} onChange={value => setField('priority', value)} />
          <EventField label="Type" value={draft.eventType} onChange={value => setField('eventType', value as EventType)} />
          <EventField
            label="Schedule intent"
            value={draft.scheduleIntent ?? ''}
            onChange={value => setField('scheduleIntent', value)}
          />
          <EventField
            label="Preferred time window"
            value={draft.preferredTimeWindow ?? ''}
            onChange={value => setField('preferredTimeWindow', value)}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(draft)}>Save</button>
        </div>
      </div>
    </div>
  );
}

function EventField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-group">
      <span className="form-label">{label}</span>
      <input className="form-input" value={value} onChange={event => onChange(event.target.value)} />
    </label>
  );
}

function filterEvents(
  events: RegisteredEvent[],
  search: string,
  typeFilter: EventTypeFilter,
) {
  const term = search.trim().toLowerCase();

  return events.filter(event => {
    const matchesSearch = !term
      || event.name.toLowerCase().includes(term)
      || event.description.toLowerCase().includes(term);
    const matchesType = typeFilter === 'ALL' || event.eventType === typeFilter;
    return matchesSearch && matchesType;
  });
}
