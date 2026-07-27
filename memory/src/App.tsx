import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { RefreshCw, Trash2 } from 'lucide-react';
import { PortalSidebar, ProfileMenu, httpService } from '@notify-ui/shared';

type PagedResponse<T> = {
  content: T[];
  totalPages: number;
};

type MemoryPage = {
  pageId: string;
  namespace?: string;
  pageType?: string;
  summary?: string;
  severityMax?: number;
  timestamp?: string;
  importance?: number;
  confidence?: number;
  createdAt?: string;
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <PortalSidebar />
        <header className="topbar">
          <div>
            <div className="topbar-title">Memory</div>
            <div className="topbar-subtitle">Consolidated memory pages</div>
          </div>
          <ProfileMenu />
        </header>
        <main className="main-content">
          <MemoryPagesTable />
        </main>
      </div>
    </BrowserRouter>
  );
}

function MemoryPagesTable() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PagedResponse<MemoryPage>>({ content: [], totalPages: 1 });

  const load = async () => {
    const next = await httpService.get<PagedResponse<MemoryPage>>('/api/admin/data/memory-pages', {
      params: { page, size: 20, sort: 'createdAt,desc' },
      ttlMs: 0,
    });
    setData(next);
  };

  useEffect(() => {
    void load();
  }, [page]);

  const erasePage = async (id: string) => {
    if (!window.confirm('Erase this memory page?')) return;

    await httpService.delete(`/api/admin/data/memory-pages/${id}`, { successModal: null });
    await load();
  };

  return (
    <section className="card">
      <div className="card-header">
        <span className="card-title">Memory Pages</span>
        <button className="btn-icon" title="Refresh memory pages" onClick={() => void load()}>
          <RefreshCw size={14} />
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Page ID</th>
              <th>Namespace</th>
              <th>Page Type</th>
              <th>Summary</th>
              <th>Severity</th>
              <th>Timestamp</th>
              <th>Importance</th>
              <th>Confidence</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.content.map(item => (
              <tr key={item.pageId}>
                <td className="mono">{item.pageId}</td>
                <td>{item.namespace || '-'}</td>
                <td>{item.pageType || '-'}</td>
                <td style={{ maxWidth: 320 }}>
                  <span
                    title={item.summary || undefined}
                    style={{
                      display: 'block',
                      maxWidth: 320,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {shortenSummary(item.summary)}
                  </span>
                </td>
                <td>{item.severityMax ?? '-'}</td>
                <td>{formatDate(item.timestamp)}</td>
                <td>{item.importance ?? '-'}</td>
                <td>{item.confidence ?? '-'}</td>
                <td>{formatDate(item.createdAt)}</td>
                <td>
                  <button
                    className="btn-icon"
                    title="Erase page"
                    style={{ color: '#ef4444' }}
                    onClick={() => void erasePage(item.pageId)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {!data.content.length && <EmptyRow columns={10} message="No memory pages found." />}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={data.totalPages} onChange={setPage} />
    </section>
  );
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: 14 }}>
      <button className="btn btn-ghost" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span style={{ padding: 7, color: '#8d855f' }}>Page {page + 1}</span>
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

function EmptyRow({ columns, message }: { columns: number; message: string }) {
  return (
    <tr>
      <td colSpan={columns} style={{ textAlign: 'center', padding: 40, color: '#8d855f' }}>
        {message}
      </td>
    </tr>
  );
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '-';
}

function shortenSummary(value?: string) {
  if (!value) return '-';
  const summary = value.trim();
  if (summary.length <= 96) return summary;
  return `${summary.slice(0, 93).trimEnd()}...`;
}
