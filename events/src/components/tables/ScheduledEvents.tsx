import React from 'react';
import { Calendar, RefreshCw } from 'lucide-react';

export function ScheduledEventsTable() {
  return (
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Calendar size={15} /> Scheduled Events</span>
          <button className="btn-icon" title="Refresh scheduled events"><RefreshCw size={14} /></button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table"><thead><tr><th>Event Name</th><th>Schedule Intent</th><th>Preferred Time Window</th><th>Status</th></tr></thead><tbody><tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#8d855f' }}>No scheduled events yet.</td></tr></tbody></table>
        </div>
      </div>
  );
}
