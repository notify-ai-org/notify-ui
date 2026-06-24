import React from 'react';
import { useLocation } from 'react-router-dom';
import { PortalSidebar } from '@notify-ui/shared';
import { Topbar } from '../components/layout/Layout';
import { MetricsDashboard } from '../components/charts/MetricsDashboard';
import { RegisteredEventsTable } from '../components/tables/RegisteredEvents';
import { ScheduledEventsTable } from '../components/tables/ScheduledEvents';
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
      <PortalSidebar />
      <Topbar onRefresh={handleRefresh} />
      <main className="main-content">
        <MetricsDashboard />
        <RegisteredEventsTable />
        <ScheduledEventsTable />
      </main>
    </div>
  );
}
