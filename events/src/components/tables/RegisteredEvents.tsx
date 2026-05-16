import React, { useEffect, useState } from 'react';
import { Search, Zap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRegisteredEvents } from '../../store/slices/eventsSlices';
import type { RegisteredEvent, EventType, EventStatus } from '../../types';

const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f59e0b', 3: '#6366f1', 4: '#22c55e', 5: '#94a3b8',
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

  useEffect(() => { dispatch(fetchRegisteredEvents()); }, [dispatch]);

  const filtered = items.filter(e => {
    const matchSearch = e.key.toLowerCase().includes(search.toLowerCase()) ||
                        e.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || e.eventType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><Zap size={15} /> Registered Events</span>
        <span style={{ fontSize: 12, color: '#475569' }}>{filtered.length} events</span>
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
                <th>Event Key</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Version</th>
                <th>Status</th>
                <th>Rules</th>
                <th>Callbacks</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <RegisteredEventRow key={e.id} event={e} />
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
    </div>
  );
}

function RegisteredEventRow({ event: e }: { event: RegisteredEvent }) {
  const [expanded, setExpanded] = useState(false);
  const statusClass = `badge badge-${e.status.toLowerCase()}`;
  const typeClass = `badge badge-${e.eventType.toLowerCase()}`;

  return (
    <>
      <tr onClick={() => setExpanded(x => !x)} style={{ cursor: 'pointer' }}>
        <td>
          <span className="mono" style={{ color: '#818cf8' }}>{e.key}</span>
        </td>
        <td><span className={typeClass}>{e.eventType}</span></td>
        <td><PriorityBadge p={e.priority} /></td>
        <td><span className="mono" style={{ color: '#94a3b8' }}>{e.version}</span></td>
        <td><span className={statusClass}>{e.status}</span></td>
        <td style={{ textAlign: 'center' }}>{e.ruleCount}</td>
        <td style={{ textAlign: 'center' }}>{e.callbackCount}</td>
        <td style={{ color: '#475569' }}>
          {new Date(e.registeredAt).toLocaleDateString()}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} style={{ background: 'rgba(99,102,241,0.04)', padding: '12px 20px' }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{e.description || 'No description provided.'}</span>
          </td>
        </tr>
      )}
    </>
  );
}
