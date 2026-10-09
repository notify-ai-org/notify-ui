import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, RefreshCw, Search } from 'lucide-react';
import { PaginationControls, getPaginated } from '@notify-ui/shared';

type EventSchedule = {
  id?: string;
  eventName: string;
  description?: string;
  channel?: string;
  triggerType?: string;
  scheduledAt?: string;
  cronExpression?: string;
};

export function EventSchedulesTable() {
  const [items, setItems] = useState<EventSchedule[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getPaginated<EventSchedule>('/api/admin/data/schedules', {
        page,
        ttlMs: 0,
      });
      setItems(result.content);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const schedules = useMemo(() => filterSchedules(items, query), [items, query]);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <CalendarClock size={15} /> Event Schedules
        </span>
        <button className="btn-icon" title="Refresh event schedules" onClick={() => void load()}>
          <RefreshCw size={14} />
        </button>
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
      <PaginationControls page={page} totalPages={totalPages} onChange={setPage} disabled={loading} />
    </div>
  );
}

function filterSchedules(items: EventSchedule[], query: string) {
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
