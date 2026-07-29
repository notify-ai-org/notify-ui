import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { RefreshCw, Trash2 } from 'lucide-react';
import { PaginationControls, PortalSidebar, ProfileMenu } from '@notify-ui/shared';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  deleteMemoryPage,
  fetchMemoryPages,
  setMemoryPagesPage,
} from './store/slices/memorySlice';
import type { MemoryPage } from './types';

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
  const dispatch = useAppDispatch();
  const { items, loading, page, totalPages, deleting } = useAppSelector(state => state.memoryPages) as {
    items: MemoryPage[];
    loading: boolean;
    page: number;
    totalPages: number;
    deleting: string[];
  };

  useEffect(() => {
    dispatch(fetchMemoryPages(page));
  }, [dispatch, page]);

  const erasePage = async (id: string) => {
    if (!window.confirm('Erase this memory page?')) return;

    await dispatch(deleteMemoryPage(id)).unwrap();
    dispatch(fetchMemoryPages(page));
  };

  return (
    <section className="card">
      <div className="card-header">
        <span className="card-title">Memory Pages</span>
        <button className="btn-icon" title="Refresh memory pages" disabled={loading} onClick={() => dispatch(fetchMemoryPages(page))}>
          <RefreshCw size={14} />
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Page ID</th>
              <th>Tenant ID</th>
              <th>Namespace</th>
              <th>Correlation ID</th>
              <th>Summary</th>
              <th>Severity</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.pageId}>
                <td className="mono">{item.pageId}</td>
                <td className="mono">{item.tenantId || '-'}</td>
                <td>{item.namespace || '-'}</td>
                <td className="mono">{item.correlationId || '-'}</td>
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
                <td>{formatDate(item.createdAt)}</td>
                <td>{formatDate(item.updatedAt)}</td>
                <td>
                  <button
                    className="btn-icon"
                    title="Erase page"
                    disabled={deleting.includes(item.pageId)}
                    style={{ color: '#ef4444' }}
                    onClick={() => void erasePage(item.pageId)}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {!items.length && <EmptyRow columns={9} message={loading ? "Loading memory pages..." : "No memory pages found."} />}
          </tbody>
        </table>
      </div>
      <PaginationControls
        page={page}
        totalPages={totalPages}
        disabled={loading}
        onChange={nextPage => dispatch(setMemoryPagesPage(nextPage))}
      />
    </section>
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
