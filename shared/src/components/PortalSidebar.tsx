import React from 'react';
import { portalHref, type PortalName } from '../navigation/portalNavigation';

const portals: Array<{ name: PortalName; label: string }> = [
  { name: 'events', label: 'Events' },
  { name: 'schedules', label: 'Schedules' },
  { name: 'logs', label: 'Logs' },
  { name: 'clients', label: 'Clients' },
  { name: 'templates', label: 'Templates' },
  { name: 'domain', label: 'Domain' },
  { name: 'vocab-rules', label: 'Vocab Rules' },
  { name: 'settings', label: 'Settings' },
  { name: 'dead-letters', label: 'Dead Letters' },
];

function isActivePortal(portal: PortalName): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.includes(`/portals/${portal}`);
}

function demoPageHref(): string {
  return "https://notify-docs-sigma.vercel.app";
}

function NotifyLogoMark(): React.JSX.Element {
  return (
    <svg className="notify-logo-mark" viewBox="0 0 1024 1024" role="img" aria-label="Notify.ai">
      <circle cx="512" cy="548" r="372" fill="#050505" />
      <path
        d="M512 338c-31.48 0-57 25.52-57 57v96H359c-31.48 0-57 25.52-57 57s25.52 57 57 57h96v96c0 31.48 25.52 57 57 57s57-25.52 57-57v-96h96c31.48 0 57-25.52 57-57s-25.52-57-57-57h-96v-96c0-31.48-25.52-57-57-57Z"
        fill="#c9c9c9"
      />
      <circle cx="772" cy="300" r="128" fill="#e8ad08" />
      <path
        d="M778.72 374h-45.6v-94.56c-15.52 10.4-31.52 16.96-48 19.68v-39.84c12.96-2.88 25.2-7.68 36.72-14.4 11.68-6.88 20.56-15.52 26.64-25.92h30.24V374Z"
        fill="#050505"
      />
    </svg>
  );
}

/** Shared shell navigation for the independently deployed portal bundles. */
export function PortalSidebar(): React.JSX.Element {
  return (
    <aside className="sidebar portal-sidebar" aria-label="Portal navigation">
      <style>{`
        :root {
          --bg-base: #090909;
          --bg-surface: #11110d;
          --bg-elevated: #191811;
          --bg-hover: #252313;
          --border: rgba(250, 204, 21, 0.18);
          --border-accent: rgba(250, 204, 21, 0.7);
          --accent: #facc15;
          --accent-light: #fde047;
          --accent-glow: rgba(250, 204, 21, 0.13);
          --text-primary: #faf8ef;
          --text-secondary: #d0c9a8;
          --text-muted: #8d855f;
          --shadow-card: 0 10px 26px rgba(0, 0, 0, 0.35);
          --shadow-glow: 0 0 32px rgba(250, 204, 21, 0.08);
        }
        .portal-sidebar { background: #11110d; border-right-color: var(--border); }
        .portal-sidebar__brand { display: flex; align-items: center; gap: 10px; padding: 0 20px 20px; border-bottom: 1px solid var(--border); text-decoration: none; }
        .portal-sidebar__brand:hover .portal-sidebar__brand-name { color: #fef08a; }
        .notify-logo-mark { display: block; width: 34px; height: 34px; flex: 0 0 auto; }
        .portal-sidebar__brand-name { color: var(--accent-light); font-size: 17px; font-weight: 800; letter-spacing: 0; }
        .portal-sidebar__section { padding: 18px 20px 7px; color: var(--text-muted); font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }
        .portal-sidebar__link { display: block; padding: 9px 20px; border-left: 2px solid transparent; color: var(--text-secondary); font-size: 13px; font-weight: 600; text-decoration: none; }
        .portal-sidebar__link:hover { background: var(--bg-hover); border-left-color: var(--border-accent); color: var(--text-primary); }
        .portal-sidebar__link--active { background: var(--accent-glow); border-left-color: var(--accent); color: var(--accent-light); }
        .topbar-title { display: inline-flex; align-items: center; gap: 9px; }
        .topbar-title::before {
          content: "";
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          background: no-repeat center / contain url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024'%3E%3Ccircle cx='512' cy='548' r='372' fill='%23050505'/%3E%3Cpath d='M512 338c-31.48 0-57 25.52-57 57v96H359c-31.48 0-57 25.52-57 57s25.52 57 57 57h96v96c0 31.48 25.52 57 57 57s57-25.52 57-57v-96h96c31.48 0 57-25.52 57-57s-25.52-57-57-57h-96v-96c0-31.48-25.52-57-57-57Z' fill='%23c9c9c9'/%3E%3Ccircle cx='772' cy='300' r='128' fill='%23e8ad08'/%3E%3Cpath d='M778.72 374h-45.6v-94.56c-15.52 10.4-31.52 16.96-48 19.68v-39.84c12.96-2.88 25.2-7.68 36.72-14.4 11.68-6.88 20.56-15.52 26.64-25.92h30.24V374Z' fill='%23050505'/%3E%3C/svg%3E");
        }
        @media (max-width: 840px) {
          .app-shell { grid-template-columns: 1fr; grid-template-rows: auto auto minmax(0, 1fr); height: 100dvh; overflow: hidden; }
          .portal-sidebar { grid-column: 1; grid-row: 1; flex-direction: row; align-items: center; gap: 0; overflow-x: auto; overflow-y: hidden; padding: 0; }
          .portal-sidebar__brand { flex: 0 0 auto; padding: 10px 14px; border-bottom: 0; border-right: 1px solid var(--border); }
          .portal-sidebar__section { display: none; }
          .portal-sidebar__link { flex: 0 0 auto; border-left: 0; border-bottom: 2px solid transparent; padding: 14px 12px; }
          .portal-sidebar__link:hover, .portal-sidebar__link--active { border-left-color: transparent; border-bottom-color: var(--accent); }
          .topbar { grid-column: 1; grid-row: 2; padding: 0 18px; }
          .main-content { grid-column: 1; grid-row: 3; padding: 18px; }
        }
      `}</style>
      <a className="portal-sidebar__brand" href={demoPageHref()} aria-label="Open Notify.ai demo page">
        <NotifyLogoMark />
        <div className="portal-sidebar__brand-name" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.025em' }}>
          <span style={{ color: '#ffffff' }}>Notify</span>
          <span style={{ background: 'linear-gradient(135deg, #facc15 0%, #fde047 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>.ai</span>
        </div>
      </a>
      <span className="portal-sidebar__section">Portals</span>
      {portals.map(({ name, label }) => (
        <a
          key={name}
          className={`portal-sidebar__link${isActivePortal(name) ? ' portal-sidebar__link--active' : ''}`}
          href={portalHref(name)}
        >
          {label}
        </a>
      ))}
    </aside>
  );
}
