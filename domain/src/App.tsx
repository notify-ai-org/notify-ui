import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import { Globe, FileCode, List, Save, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { fetchDomains, fetchDomainForm, saveDomainForm } from './store/slices/domainSlice';
import type { DomainEntry, DomainField } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(fn: (s: RootState) => T) => useSelector<RootState, T>(fn);
const ACCENT = '#f97316';
const BASE = import.meta.env.VITE_PORTAL_BASE ?? '/portals/domain/';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Globe size={20} style={{ color: ACCENT }} />
        <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #fb923c)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Domain</span>
      </div>
      <span className="nav-section-label">Content</span>
      {[{ to: '/', label: 'Domains', icon: List }, { to: '/forms', label: 'Content Forms', icon: FileCode }]
        .map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={15} />{label}
          </NavLink>
        ))}
    </aside>
  );
}

function DomainList() {
  const dispatch = useD();
  const { domains, loading } = useS(s => (s as any).domains) as any;
  const navigate = useNavigate();

  useEffect(() => { dispatch(fetchDomains()); }, [dispatch]);

  return (
    <div className="card">
      <div className="card-header"><span className="card-title"><Globe size={15} /> Registered Domains</span></div>
      <div style={{ overflowX: 'auto' }}>
        {loading ? <div style={{ padding: 24 }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 10, borderRadius: 8 }} />)}</div> : (
          <table className="data-table">
            <thead><tr><th>Domain</th><th>Description</th><th>Schema</th><th>Fields</th><th>Status</th></tr></thead>
            <tbody>
              {(domains as DomainEntry[]).map(d => (
                <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/forms/${d.id}`)}>
                  <td style={{ color: '#f1f5f9', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ color: '#94a3b8' }}>{d.description}</td>
                  <td><span className="mono" style={{ color: '#64748b', fontSize: 11 }}>{d.schemaVersion}</span></td>
                  <td style={{ textAlign: 'center' }}>{d.fieldCount}</td>
                  <td><span className={`badge badge-${d.active ? 'active' : 'inactive'}`}>{d.active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                </tr>
              ))}
              {!domains.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No domains registered</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const FIELD_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'OBJECT', 'ARRAY'] as const;

function DomainFormEditor() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useD();
  const navigate = useNavigate();
  const { form, saving } = useS(s => (s as any).domains) as any;

  useEffect(() => { if (id) dispatch(fetchDomainForm(id)); }, [id]);

  const addField = () => {
    if (!form) return;
    const newField: DomainField = { name: '', type: 'STRING', required: false, description: '', defaultValue: null };
    dispatch({ type: 'domains/setForm', payload: { ...form, fields: [...form.fields, newField] } });
  };

  const updateField = (idx: number, patch: Partial<DomainField>) => {
    if (!form) return;
    const fields = form.fields.map((f: DomainField, i: number) => i === idx ? { ...f, ...patch } : f);
    dispatch({ type: 'domains/setForm', payload: { ...form, fields } });
  };

  const removeField = (idx: number) => {
    if (!form) return;
    dispatch({ type: 'domains/setForm', payload: { ...form, fields: form.fields.filter((_: any, i: number) => i !== idx) } });
  };

  if (!form) return <div style={{ padding: 40, color: '#475569', textAlign: 'center' }}>Loading form…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title"><FileCode size={15} /> {form.title}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button>
            <button className="btn btn-primary" disabled={saving} onClick={() => dispatch(saveDomainForm({ id: id!, form }))}>
              <Save size={13} />{saving ? 'Saving…' : 'Save Form'}
            </button>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>{form.fields.length} fields defined</span>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={addField}><Plus size={13} /> Add Field</button>
          </div>
          <table className="data-table">
            <thead><tr><th>Field Name</th><th>Type</th><th>Required</th><th>Description</th><th>Default</th><th></th></tr></thead>
            <tbody>
              {form.fields.map((f: DomainField, i: number) => (
                <tr key={i}>
                  <td><input className="form-input" value={f.name} onChange={e => updateField(i, { name: e.target.value })} placeholder="field_name" /></td>
                  <td>
                    <select className="form-input" value={f.type} onChange={e => updateField(i, { type: e.target.value as any })}>
                      {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={f.required} onChange={e => updateField(i, { required: e.target.checked })} style={{ accentColor: ACCENT }} />
                  </td>
                  <td><input className="form-input" value={f.description} onChange={e => updateField(i, { description: e.target.value })} placeholder="Description" /></td>
                  <td><input className="form-input" style={{ width: 120 }} defaultValue={String(f.defaultValue ?? '')} placeholder="—" /></td>
                  <td><button className="btn-icon" style={{ color: '#ef4444' }} onClick={() => removeField(i)}><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Sample Payload</span></div>
        <div className="card-body">
          <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#94a3b8', margin: 0 }}>
            {JSON.stringify(form.samplePayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <Sidebar />
        <header className="topbar"><div><div className="topbar-title">Domain Content</div><div className="topbar-subtitle">Manage domain schemas and content forms</div></div></header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<DomainList />} />
            <Route path="/forms" element={<DomainList />} />
            <Route path="/forms/:id" element={<DomainFormEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
