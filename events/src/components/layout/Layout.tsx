import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Zap, BarChart2, Calendar, FileText, Bell, RefreshCw,
} from 'lucide-react';

const NAV = [
  { to: '/',            label: 'Overview',          icon: BarChart2 },
  { to: '/registered',  label: 'Registered Events',  icon: Zap },
  { to: '/scheduled',   label: 'Scheduled Events',   icon: Calendar },
  { to: '/capture-log', label: 'Capture Log',        icon: FileText },
  { to: '/notif-log',   label: 'Notification Log',   icon: Bell },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Zap size={22} style={{ color: '#818cf8' }} />
        <span>Events Portal</span>
      </div>

      <span className="nav-section-label">Navigation</span>

      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </aside>
  );
}

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
        {onRefresh && (
          <button className="btn btn-ghost" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        )}
      </div>
    </header>
  );
}
