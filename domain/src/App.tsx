import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Globe, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { PortalSidebar, ProfileMenu, httpService } from '@notify-ui/shared';

const VALUE_TYPES = ['TEXT', 'IMAGE', 'FILE', 'NUMBER', 'DATE', 'RANGE'] as const;

type ValueType = typeof VALUE_TYPES[number];
type DomainContent = {
  id: string;
  keyName?: string;
  description?: string;
  content?: string;
  type?: string;
  valueType?: ValueType;
  clientId?: string;
  version?: number;
};
type PagedResponse<T> = { content: T[] };

export default function App() {
  const [items, setItems] = useState<DomainContent[]>([]);
  const [editorValue, setEditorValue] = useState<DomainContent | null>(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const page = await httpService.get<PagedResponse<DomainContent>>('/api/admin/data/domain-content', {
      params: { page: 0, size: 100 },
      ttlMs: 0,
    });
    setItems(page.content ?? []);
  };

  useEffect(() => { void load(); }, []);

  const deleteContent = async (id: string) => {
    if (!window.confirm('Delete this domain content entry?')) return;
    await httpService.delete(`/api/admin/data/domain-content/${id}`, { successModal: null });
    await load();
  };

  const closeEditor = () => {
    setEditorValue(null);
    setCreating(false);
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <PortalSidebar />
        <header className="topbar">
          <div><div className="topbar-title">Domain Content</div><div className="topbar-subtitle">Manage domain-specific values</div></div>
          <ProfileMenu />
        </header>
        <main className="main-content">
          <section className="card">
            <div className="card-header">
              <span className="card-title"><Globe size={15} /> Content entries</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-icon" title="Refresh content" onClick={() => void load()}><RefreshCw size={14} /></button>
                <button className="btn btn-primary" onClick={() => setCreating(true)}><Plus size={14} /> New entry</button>
              </div>
            </div>
            <ContentTable items={items} onEdit={setEditorValue} onDelete={deleteContent} />
          </section>
        </main>
        {(creating || editorValue) && <ContentEditor initialValue={editorValue} onClose={closeEditor} onSaved={load} />}
      </div>
    </BrowserRouter>
  );
}

function ContentTable({ items, onEdit, onDelete }: { items: DomainContent[]; onEdit: (item: DomainContent) => void; onDelete: (id: string) => Promise<void> }) {
  return <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>Domain Key</th><th>Description</th><th>Value</th><th>Value Type</th><th>Actions</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td className="mono" style={{ color: '#fde047' }}>{item.keyName || '—'}</td><td>{item.description || '—'}</td><td style={{ maxWidth: 380, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.content || '—'}</td><td>{item.valueType || 'TEXT'}</td><td><div style={{ display: 'flex', gap: 5 }}><button className="btn-icon" title="Edit content" onClick={() => onEdit(item)}><Pencil size={14} /></button><button className="btn-icon" title="Delete content" style={{ color: '#ef4444' }} onClick={() => void onDelete(item.id)}><Trash2 size={14} /></button></div></td></tr>)}{!items.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#8d855f' }}>No domain content entries found.</td></tr>}</tbody></table></div>;
}

function ContentEditor({ initialValue, onClose, onSaved }: { initialValue: DomainContent | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [value, setValue] = useState<DomainContent>(initialValue ?? { keyName: '', description: '', content: '', type: 'FULL', valueType: 'TEXT' });
  const save = async () => { const body = { ...value, type: value.type || 'FULL', valueType: value.valueType || 'TEXT' }; if (initialValue) await httpService.put(`/api/admin/data/domain-content/${initialValue.id}`, { data: body, successModal: null }); else await httpService.post('/api/admin/data/domain-content', { data: body, successModal: null }); await onSaved(); onClose(); };
  return <div className="modal-overlay"><div className="modal-box"><div className="modal-header"><span className="modal-title">{initialValue ? 'Edit domain content' : 'New domain content'}</span><button className="btn-icon" onClick={onClose}><X size={15} /></button></div><div className="modal-body" style={{ display: 'grid', gap: 12 }}><TextField label="Domain key" value={value.keyName ?? ''} onChange={keyName => setValue({ ...value, keyName })} /><TextField label="Description" value={value.description ?? ''} onChange={description => setValue({ ...value, description })} /><label className="form-group"><span className="form-label">Value type</span><select className="form-input" value={value.valueType || 'TEXT'} onChange={event => setValue({ ...value, valueType: event.target.value as ValueType })}>{VALUE_TYPES.map(type => <option key={type}>{type}</option>)}</select></label><label className="form-group"><span className="form-label">Value</span><textarea className="form-input" rows={6} value={value.content ?? ''} onChange={event => setValue({ ...value, content: event.target.value })} /></label></div><div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => void save()}>Save</button></div></div></div>;
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="form-group"><span className="form-label">{label}</span><input className="form-input" value={value} onChange={event => onChange(event.target.value)} /></label>; }
