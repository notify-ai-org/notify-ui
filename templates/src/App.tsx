import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useParams } from 'react-router-dom';
import { FileText, Plus, Search, CheckCircle, AlertTriangle, Trash2, Edit2, Eye, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import {
  fetchTemplates, fetchTemplate, saveTemplate, deleteTemplate, validateTemplate,
  setSelected, clearValidation,
} from './store/slices/templatesSlice';
import type { Template, TemplateChannel } from './types';

const useAppDispatch = () => useDispatch<AppDispatch>();
const useAppSelector = <T,>(fn: (s: RootState) => T) => useSelector<RootState, T>(fn);

const ACCENT = '#06b6d4';
const CHANNEL_COLORS: Record<TemplateChannel, string> = {
  EMAIL: '#6366f1', SMS: '#22c55e', PUSH: '#f59e0b', WEBHOOK: '#ef4444', IN_APP: '#a855f7',
};

const BASE = import.meta.env.VITE_PORTAL_BASE ?? '/portals/templates/';

/* ── Sidebar ── */
function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <FileText size={20} style={{ color: ACCENT }} />
        <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #818cf8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Templates</span>
      </div>
      <span className="nav-section-label">Browse</span>
      {[
        { to: '/', label: 'All Templates', icon: FileText },
        { to: '/new', label: 'New Template', icon: Plus },
      ].map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon size={15} />{label}
        </NavLink>
      ))}
    </aside>
  );
}

/* ── Templates list ── */
function TemplateList() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector(s => (s as any).templates);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<TemplateChannel | 'ALL'>('ALL');
  const navigate = useNavigate();

  useEffect(() => { dispatch(fetchTemplates()); }, [dispatch]);

  const filtered = items.filter((t: Template) => {
    const q = search.toLowerCase();
    return (channel === 'ALL' || t.channel === channel) &&
      (t.name.toLowerCase().includes(q) || t.eventKey.toLowerCase().includes(q));
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this template?')) dispatch(deleteTemplate(id));
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><FileText size={15} /> Templates</span>
        <button className="btn btn-primary" onClick={() => navigate('/new')}><Plus size={14} /> New Template</button>
      </div>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        <div className="search-input"><Search size={14} /><input placeholder="Search templates…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        {(['ALL', 'EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP'] as const).map(c => (
          <button key={c} className={`btn ${channel === c ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => setChannel(c)}>{c}</button>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        {loading ? <div style={{ padding: 24 }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />)}</div> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Channel</th><th>Event</th><th>Version</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((t: Template) => (
                <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/edit/${t.id}`)}>
                  <td style={{ color: '#f1f5f9', fontWeight: 500 }}>{t.name}</td>
                  <td><span className="badge" style={{ background: `${CHANNEL_COLORS[t.channel]}22`, color: CHANNEL_COLORS[t.channel] }}>{t.channel}</span></td>
                  <td><span className="mono" style={{ color: '#94a3b8' }}>{t.eventKey}</span></td>
                  <td className="mono" style={{ color: '#475569' }}>v{t.version}</td>
                  <td><span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span></td>
                  <td style={{ color: '#475569' }}>{format(parseISO(t.updatedAt), 'MMM d, HH:mm')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title="Edit" onClick={e => { e.stopPropagation(); navigate(`/edit/${t.id}`); }}><Edit2 size={13} /></button>
                      <button className="btn-icon" title="Delete" style={{ color: '#ef4444' }} onClick={e => handleDelete(e, t.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No templates found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Template Editor ── */
function TemplateEditor({ isNew }: { isNew?: boolean }) {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { selected, saving, validation, validating } = useAppSelector(s => (s as any).templates);

  const blank: Partial<Template> = { name: '', channel: 'EMAIL', status: 'DRAFT', subject: '', body: '', eventKey: '', variables: [] };
  const [form, setForm] = useState<Partial<Template>>(blank);

  useEffect(() => {
    if (!isNew && id) { dispatch(fetchTemplate(id)); }
    return () => { dispatch(setSelected(null)); dispatch(clearValidation()); };
  }, [id, isNew]);

  useEffect(() => { if (selected && !isNew) setForm(selected); }, [selected]);

  const set = (k: keyof Template, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    await dispatch(saveTemplate({ id: isNew ? null : id!, data: form }));
    navigate('/');
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="form-group"><label className="form-label">{label}</label>{children}</div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Edit2 size={15} /> {isNew ? 'New Template' : `Edit: ${form.name}`}</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => navigate('/')}><X size={14} /> Cancel</button>
            <button className="btn btn-primary" disabled={saving} onClick={handleSave}><Save size={14} />{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <Field label="Template Name"><input className="form-input" value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="my-template" /></Field>
          <Field label="Channel">
            <select className="form-input" value={form.channel} onChange={e => set('channel', e.target.value as TemplateChannel)}>
              {['EMAIL', 'SMS', 'PUSH', 'WEBHOOK', 'IN_APP'].map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Event Key"><input className="form-input" value={form.eventKey ?? ''} onChange={e => set('eventKey', e.target.value)} placeholder="order.placed" /></Field>
          {form.channel === 'EMAIL' && (
            <Field label="Subject"><input className="form-input" value={form.subject ?? ''} onChange={e => set('subject', e.target.value)} placeholder="Order {{orderId}} confirmed" /></Field>
          )}
          <Field label="Status">
            <select className="form-input" value={form.status} onChange={e => set('status', e.target.value as any)}>
              {['DRAFT', 'ACTIVE', 'ARCHIVED'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Editor + Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Edit2 size={15} /> Template Body</span>
            <button className="btn btn-ghost" style={{ fontSize: 12 }} disabled={validating} onClick={() => dispatch(validateTemplate(form.body ?? ''))}>
              <CheckCircle size={13} />{validating ? 'Validating…' : 'Validate'}
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <textarea
              value={form.body ?? ''}
              onChange={e => { set('body', e.target.value); dispatch(clearValidation()); }}
              style={{
                width: '100%', minHeight: 320, background: 'transparent', border: 'none',
                color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                padding: 16, outline: 'none', resize: 'vertical',
              }}
              placeholder="Hello {{firstName}},&#10;&#10;Your order {{orderId}} has been confirmed."
            />
          </div>
          {/* Validation results */}
          {validation && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: validation.valid ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 13 }}>
                {validation.valid ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                {validation.valid ? 'Template is valid' : `${validation.errors.length} error(s)`}
              </div>
              {validation.errors.map((err: { line: number; message: string }, i: number) => (
                <div key={i} style={{ color: '#ef4444', fontSize: 12, marginBottom: 4 }}>
                  Line {err.line}: {err.message}
                </div>
              ))}
              {validation.warnings.map((w: string, i: number) => (
                <div key={i} style={{ color: '#f59e0b', fontSize: 12, marginBottom: 4 }}>⚠ {w}</div>
              ))}
              {validation.resolvedVariables.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {validation.resolvedVariables.map((v: string) => (
                    <span key={v} style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{'{{' + v + '}}'}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="card">
          <div className="card-header"><span className="card-title"><Eye size={15} /> Preview</span></div>
          <div className="card-body">
            <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const }}>
              {form.body || <span style={{ color: '#334155' }}>Template body will appear here…</span>}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── App ── */
export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <Sidebar />
        <header className="topbar">
          <div><div className="topbar-title">Templates</div><div className="topbar-subtitle">Manage notification templates</div></div>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<TemplateList />} />
            <Route path="/new" element={<TemplateEditor isNew />} />
            <Route path="/edit/:id" element={<TemplateEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
