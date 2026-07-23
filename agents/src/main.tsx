import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Activity, Bot, Braces, Clock3, RefreshCw } from 'lucide-react';
import {
  ModalProvider,
  PortalSidebar,
  ProfileMenu,
  createSharedStore,
  httpService,
  initApiConfig,
  registerErrorHandlerStore,
  registerHttpServiceStore,
} from '@notify-ui/shared';
import '../../events/src/styles/global.css';

type PageResponse<T> = {
  content: T[];
  totalPages: number;
  totalElements?: number;
};

type AgentSnapshot = {
  id?: string;
  agentId?: string;
  agentName?: string;
  agentType?: string;
  currentStage?: string;
  createdAt?: string;
  updatedAt?: string;
  lastActivityAt?: string;
  currentTaskId?: string;
  agentStateJson?: string;
};

type SnapshotCounts = {
  running: number;
  ready: number;
  withTask: number;
};

initApiConfig({
  baseURL: '',
  getAccessToken: () => document.cookie.match(/notify_access_token=([^;]+)/)?.[1] ?? null,
});

const store = createSharedStore();
registerHttpServiceStore(store);
registerErrorHandlerStore(store);

function AgentsApp() {
  const [page, setPage] = useState(0);
  const [snapshots, setSnapshots] = useState<PageResponse<AgentSnapshot>>({
    content: [],
    totalPages: 1,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const response = await httpService.get<PageResponse<AgentSnapshot>>('/api/admin/data/agent-snapshots', {
        params: { page, size: 30, sort: 'lastActivityAt,desc' },
        ttlMs: 0,
        forceRefresh: true,
      });

      setSnapshots(response);
      setLastLoadedAt(new Date());
      setSelectedId(current => current ?? getSnapshotId(response.content[0]) ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page]);

  const selected = useMemo(() => {
    return snapshots.content.find(snapshot => getSnapshotId(snapshot) === selectedId)
      ?? snapshots.content[0]
      ?? null;
  }, [selectedId, snapshots.content]);

  const counts = useMemo(() => summarize(snapshots.content), [snapshots.content]);

  return (
    <div className="app-shell">
      <PortalSidebar />
      <header className="topbar">
        <div>
          <div className="topbar-title">Agents</div>
          <div className="topbar-subtitle">Runtime snapshots, stages, and current task state</div>
        </div>
        <div className="topbar-actions">
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {lastLoadedAt ? `Updated ${lastLoadedAt.toLocaleTimeString()}` : 'Not loaded'}
          </span>
          <button
            className="btn-icon"
            title="Refresh agents"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin' : undefined} />
          </button>
          <ProfileMenu />
        </div>
      </header>

      <main className="main-content">
        <section className="metrics-grid">
          <Metric
            label="Agents"
            value={String(snapshots.totalElements ?? snapshots.content.length)}
            icon={<Bot size={16} />}
          />
          <Metric label="Running" value={String(counts.running)} icon={<Activity size={16} />} />
          <Metric label="Ready" value={String(counts.ready)} icon={<Clock3 size={16} />} />
          <Metric label="With Task" value={String(counts.withTask)} icon={<Braces size={16} />} />
        </section>

        <section className="agent-layout">
          <div className="card agent-list-card">
            <div className="card-header">
              <span className="card-title">
                <Bot size={15} /> Agent snapshots
              </span>
              <button className="btn btn-ghost" onClick={() => void load()} disabled={loading}>
                Refresh
              </button>
            </div>
            <AgentList
              snapshots={snapshots.content}
              selectedId={selectedId}
              onSelect={setSelectedId}
              loading={loading}
            />
            <Pagination page={page} totalPages={snapshots.totalPages} onChange={setPage} />
          </div>

          <div className="card agent-detail-card">
            <div className="card-header">
              <span className="card-title">
                <Braces size={15} /> Current task JSON
              </span>
              {selected && <StageBadge stage={selected.currentStage} />}
            </div>
            {selected ? <AgentDetails snapshot={selected} /> : <EmptyState loading={loading} />}
          </div>
        </section>
      </main>

      <AgentStyles />
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="metric-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 12 }}>{label}</span>
        <span style={{ color: 'var(--accent)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>{value}</div>
    </div>
  );
}

function AgentList({
  snapshots,
  selectedId,
  onSelect,
  loading,
}: {
  snapshots: AgentSnapshot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  if (!loading && snapshots.length === 0) {
    return (
      <div style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
        No agent snapshots found.
      </div>
    );
  }

  return (
    <div>
      {snapshots.map(snapshot => (
        <AgentListRow
          key={getSnapshotId(snapshot)}
          snapshot={snapshot}
          selected={selectedId === getSnapshotId(snapshot)}
          onSelect={onSelect}
        />
      ))}
      {loading && (
        <div style={{ padding: 16, color: 'var(--text-muted)' }}>
          Loading snapshots...
        </div>
      )}
    </div>
  );
}

function AgentListRow({
  snapshot,
  selected,
  onSelect,
}: {
  snapshot: AgentSnapshot;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const rowId = getSnapshotId(snapshot);

  return (
    <button
      className={`agent-row${selected ? ' agent-row--active' : ''}`}
      onClick={() => onSelect(rowId)}
    >
      <span>
        <div className="agent-row__name">{snapshot.agentName ?? snapshot.agentId ?? 'Unnamed agent'}</div>
        <div className="agent-row__meta">
          <span>{snapshot.agentType ?? 'unknown type'}</span>
          <span>{snapshot.agentId ?? 'no id'}</span>
        </div>
      </span>
      <StageBadge stage={snapshot.currentStage} />
    </button>
  );
}

function AgentDetails({ snapshot }: { snapshot: AgentSnapshot }) {
  return (
    <>
      <div className="detail-strip">
        <Detail label="Agent ID" value={snapshot.agentId} />
        <Detail label="Current Task ID" value={snapshot.currentTaskId} />
        <Detail label="Last Activity" value={formatDate(snapshot.lastActivityAt)} />
        <Detail label="Updated" value={formatDate(snapshot.updatedAt)} />
      </div>
      <pre className="json-panel">{prettySnapshotJson(snapshot)}</pre>
    </>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-item">
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value || '-'}</div>
    </div>
  );
}

function StageBadge({ stage }: { stage?: string }) {
  const key = (stage ?? 'unknown').toLowerCase();
  const className = getStageClassName(key);

  return <span className={`stage-badge ${className}`}>{stage ?? 'UNKNOWN'}</span>;
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        padding: 14,
        borderTop: '1px solid var(--border)',
      }}
    >
      <button className="btn btn-ghost" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span style={{ padding: '7px 0', color: 'var(--text-muted)' }}>Page {page + 1}</span>
      <button
        className="btn btn-ghost"
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div
      style={{
        minHeight: 360,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--text-muted)',
      }}
    >
      {loading ? 'Loading snapshots...' : 'Select an agent to view its current task JSON.'}
    </div>
  );
}

function AgentStyles() {
  return (
    <style>{`
      .spin {
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .agent-layout {
        display: grid;
        grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
        gap: 18px;
        align-items: start;
      }

      .agent-list-card,
      .agent-detail-card {
        min-width: 0;
      }

      .agent-row {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 10px;
        border: 0;
        border-bottom: 1px solid var(--border);
        background: transparent;
        color: var(--text-primary);
        text-align: left;
        padding: 14px 16px;
        cursor: pointer;
      }

      .agent-row:hover {
        background: rgba(250, 204, 21, 0.06);
      }

      .agent-row--active {
        background: rgba(250, 204, 21, 0.1);
        box-shadow: inset 2px 0 0 var(--accent);
      }

      .agent-row__name {
        font-weight: 700;
        overflow-wrap: anywhere;
      }

      .agent-row__meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        color: var(--text-muted);
        font-size: 12px;
        margin-top: 4px;
      }

      .stage-badge {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 3px 9px;
        border-radius: 999px;
        border: 1px solid var(--border);
        font-size: 11px;
        font-weight: 800;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.03);
      }

      .stage-badge--running {
        color: #86efac;
        border-color: rgba(34, 197, 94, 0.35);
        background: rgba(34, 197, 94, 0.1);
      }

      .stage-badge--failed {
        color: #fca5a5;
        border-color: rgba(239, 68, 68, 0.35);
        background: rgba(239, 68, 68, 0.1);
      }

      .stage-badge--ready {
        color: #fef08a;
        border-color: rgba(250, 204, 21, 0.35);
        background: rgba(250, 204, 21, 0.1);
      }

      .json-panel {
        min-height: 420px;
        max-height: calc(100vh - 310px);
        overflow: auto;
        padding: 16px;
        background: #070705;
        color: #d0c9a8;
        font-family: var(--font-mono);
        font-size: 12px;
        line-height: 1.65;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        border-top: 1px solid var(--border);
      }

      .detail-strip {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        padding: 16px;
        border-top: 1px solid var(--border);
      }

      .detail-item {
        min-width: 0;
      }

      .detail-label {
        color: var(--text-muted);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
      }

      .detail-value {
        color: var(--text-secondary);
        margin-top: 3px;
        overflow-wrap: anywhere;
      }

      @media (max-width: 1080px) {
        .agent-layout {
          grid-template-columns: 1fr;
        }

        .json-panel {
          max-height: 540px;
        }
      }

      @media (max-width: 640px) {
        .detail-strip {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

function getStageClassName(stage: string) {
  if (stage.includes('running')) return 'stage-badge--running';
  if (stage.includes('failed')) return 'stage-badge--failed';
  if (stage.includes('ready')) return 'stage-badge--ready';
  return '';
}

function getSnapshotId(snapshot?: AgentSnapshot) {
  return snapshot?.id ?? snapshot?.agentId ?? '';
}

function summarize(snapshots: AgentSnapshot[]): SnapshotCounts {
  return snapshots.reduce<SnapshotCounts>((acc, snapshot) => {
    const stage = (snapshot.currentStage ?? '').toLowerCase();
    if (stage.includes('running')) acc.running += 1;
    if (stage.includes('ready')) acc.ready += 1;
    if (snapshot.currentTaskId) acc.withTask += 1;
    return acc;
  }, { running: 0, ready: 0, withTask: 0 });
}

function prettySnapshotJson(snapshot: AgentSnapshot) {
  const state = parseJson(snapshot.agentStateJson);
  const currentTask = {
    currentTaskId: snapshot.currentTaskId ?? null,
    agentState: state ?? snapshot.agentStateJson ?? {},
  };

  return JSON.stringify(currentTask, null, 2);
}

function parseJson(value?: string) {
  if (!value || !value.trim()) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatDate(value?: string) {
  if (!value) return '-';

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <AgentsApp />
      </ModalProvider>
    </Provider>
  </React.StrictMode>,
);
