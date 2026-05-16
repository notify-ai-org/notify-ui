import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar, Topbar } from '../components/layout/Layout';
import { MetricsDashboard } from '../components/charts/MetricsDashboard';
import { RegisteredEventsTable } from '../components/tables/RegisteredEvents';
import { ScheduledEventsTable } from '../components/tables/ScheduledEvents';
import { CaptureLog, NotificationLog } from '../components/tables/Logs';
import { useAppDispatch } from '../store/hooks';
import { fetchMetrics, fetchRegisteredEvents, fetchScheduledEvents } from '../store/slices/eventsSlices';

export function EventsDashboard() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();

  const handleRefresh = () => {
    if (pathname === '/') dispatch(fetchMetrics());
    else if (pathname === '/registered') dispatch(fetchRegisteredEvents());
    else if (pathname === '/scheduled') dispatch(fetchScheduledEvents());
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <Topbar onRefresh={handleRefresh} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<MetricsDashboard />} />
          <Route path="/registered" element={<RegisteredEventsTable />} />
          <Route path="/scheduled" element={<ScheduledEventsTable />} />
          <Route path="/capture-log" element={<CaptureLog />} />
          <Route path="/notif-log" element={<NotificationLog />} />
        </Routes>
      </main>
    </div>
  );
}
