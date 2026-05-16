import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';

/* ── Lazy-load every portal App ── */
const HomeApp       = lazy(() => import('../../home/src/App'));
const SDKGuideApp   = lazy(() => import('../../sdk-guide/src/App'));
const LoginApp      = lazy(() => import('../../login/src/App'));
const EventsApp     = lazy(() => import('../../events/src/App'));
const TemplatesApp  = lazy(() => import('../../templates/src/App'));
const MemoryApp     = lazy(() => import('../../memory/src/App'));
const DomainApp     = lazy(() => import('../../domain/src/App'));
const VocabApp      = lazy(() => import('../../vocab-rules/src/App'));
const SettingsApp   = lazy(() => import('../../settings/src/App'));
const DLQApp        = lazy(() => import('../../dead-letters/src/App'));

/* ── Portal registry ── */
interface PortalDef {
  key: string;
  label: string;
  emoji: string;
  basePath: string;
  accent: string;
}

const GROUPS: { label: string; portals: PortalDef[] }[] = [
  {
    label: 'Public',
    portals: [
      { key: 'home',      label: 'Home',      emoji: '⚡', basePath: '/portals/home',      accent: '#eab308' },
      { key: 'sdk-guide', label: 'SDK Guide', emoji: '📖', basePath: '/portals/sdk-guide', accent: '#eab308' },
    ],
  },
  {
    label: 'Auth',
    portals: [
      { key: 'login', label: 'Login / Forbidden', emoji: '🔐', basePath: '/portals/login', accent: '#6366f1' },
    ],
  },
  {
    label: 'Admin',
    portals: [
      { key: 'events',       label: 'Events',       emoji: '📡', basePath: '/portals/events',       accent: '#6366f1' },
      { key: 'templates',    label: 'Templates',    emoji: '📄', basePath: '/portals/templates',    accent: '#06b6d4' },
      { key: 'memory',       label: 'Memory',       emoji: '🧠', basePath: '/portals/memory',       accent: '#a855f7' },
      { key: 'domain',       label: 'Domain',       emoji: '🌐', basePath: '/portals/domain',       accent: '#f97316' },
      { key: 'vocab-rules',  label: 'Vocab Rules',  emoji: '📚', basePath: '/portals/vocab-rules',  accent: '#3b82f6' },
      { key: 'settings',     label: 'Settings',     emoji: '⚙️',  basePath: '/portals/settings',     accent: '#64748b' },
      { key: 'dead-letters', label: 'Dead Letters', emoji: '💀', basePath: '/portals/dead-letters', accent: '#ef4444' },
    ],
  },
];

const ALL_PORTALS = GROUPS.flatMap(g => g.portals);

/* ── Loading fallback ── */
function Spinner() {
  return (
    <div className="dev-spinner">
      <div className="dev-spinner-ring" />
      <span>Loading portal…</span>
    </div>
  );
}

/* ── Welcome screen ── */
function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="dev-welcome">
      <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
      <h2>Notify.ai Dev Shell</h2>
      <p>Select a portal from the sidebar to get started, or jump straight in:</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
        {ALL_PORTALS.map(p => (
          <button key={p.key} onClick={() => navigate(p.basePath + '/')}
            style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${p.accent}44`, background: `${p.accent}11`, color: p.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            {p.emoji} {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Top bar ── */
function TopBar() {
  const loc = useLocation();
  return (
    <header className="dev-topbar">
      <div className="dev-logo">
        <span className="dev-logo-glyph">⚡</span>
        <span style={{ background: 'linear-gradient(135deg,#eab308,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Notify.ai</span>
      </div>
      <span className="dev-badge">DEV</span>
      <div className="dev-url">{loc.pathname || '/'}</div>
    </header>
  );
}

/* ── Portal sidebar ── */
function PortalSidebar() {
  const navigate = useNavigate();
  const loc = useLocation();

  const activeKey = ALL_PORTALS.find(p => loc.pathname.startsWith(p.basePath))?.key ?? '';

  return (
    <aside className="dev-sidebar">
      {GROUPS.map(g => (
        <div key={g.label}>
          <div className="dev-group-label">{g.label}</div>
          {g.portals.map(p => (
            <button
              key={p.key}
              className={`dev-portal-btn${activeKey === p.key ? ' active' : ''}`}
              onClick={() => navigate(p.basePath + '/')}
            >
              <span className="dev-portal-emoji">{p.emoji}</span>
              <span className="dev-portal-dot" style={{ background: p.accent, opacity: activeKey === p.key ? 1 : 0.3 }} />
              {p.label}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}

/* ── Router shell (needs to be inside BrowserRouter for hooks) ── */
function Shell() {
  return (
    <div className="dev-shell">
      <TopBar />
      <PortalSidebar />
      <main className="dev-content">
        <Suspense fallback={<Spinner />}>
          <Routes>
            {/* Public */}
            <Route path="/portals/home/*"      element={<HomeApp />} />
            <Route path="/portals/sdk-guide/*" element={<SDKGuideApp />} />

            {/* Auth */}
            <Route path="/portals/login/*"     element={<LoginApp />} />

            {/* Admin */}
            <Route path="/portals/events/*"       element={<EventsApp />} />
            <Route path="/portals/templates/*"    element={<TemplatesApp />} />
            <Route path="/portals/memory/*"       element={<MemoryApp />} />
            <Route path="/portals/domain/*"       element={<DomainApp />} />
            <Route path="/portals/vocab-rules/*"  element={<VocabApp />} />
            <Route path="/portals/settings/*"     element={<SettingsApp />} />
            <Route path="/portals/dead-letters/*" element={<DLQApp />} />

            {/* Default */}
            <Route path="*" element={<Welcome />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

/* ── Root App ── */
export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
