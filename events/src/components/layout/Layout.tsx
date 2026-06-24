import React from 'react';
import { useLocation } from 'react-router-dom';
import { ProfileMenu } from '@notify-ui/shared';

interface TopbarProps {
  onRefresh?: () => void;
  loading?: boolean;
}

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/':            { title: 'Overview',         subtitle: 'Metrics, activity and system health' },
  '/registered':  { title: 'Registered Events', subtitle: 'All events registered in the system' },
  '/scheduled':   { title: 'Scheduled Events',  subtitle: 'Manage cron-based event triggers' },
  '/capture-log': { title: 'Capture Log',       subtitle: 'Incoming event capture history' },
  '/notif-log':   { title: 'Notification Log',  subtitle: 'Outbound notification delivery records' },
};

export function Topbar({ onRefresh, loading }: TopbarProps) {
  const { pathname } = useLocation();
  const info = PAGE_TITLES[pathname] ?? { title: 'Events', subtitle: '' };

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{info.title}</div>
        <div className="topbar-subtitle">{info.subtitle}</div>
      </div>
      <div className="topbar-actions">
        <ProfileMenu />
      </div>
    </header>
  );
}
