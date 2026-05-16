import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Search, Trash2, ToggleLeft, ToggleRight, Save, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { fetchRules, saveRule, deleteRule, toggleRule } from './store/slices/vocabSlice';
import type { VocabRule } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(fn: (s: RootState) => T) => useSelector<RootState, T>(fn);
const ACCENT = '#3b82f6';
const BASE = import.meta.env.VITE_PORTAL_BASE ?? '/portals/vocab-rules/';

const PRIORITY_COLORS: Record<number, string> = { 1: '#ef4444', 2: '#f59e0b', 3: '#6366f1', 4: '#22c55e', 5: '#94a3b8' };

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <BookOpen size={20} style={{ color: ACCENT }} />
        <span style={{ background: `linear-gradient(135deg, ${ACCENT}, #60a5fa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Vocab Rules</span>
      </div>
      <span className="nav-section-label">Rules</span>
      {[{ to: '/', label: 'All Rules', icon: BookOpen }, { to: '/new', label: 'New Rule', icon: Plus }]
        .map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={15} />{label}
          </NavLink>
        ))}
    </aside>
  );
}

function RuleList() {
  const dispatch = useD();
  const { items, loading } = useS(s => (s as any).vocab) as any;
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => { dispatch(fetchRules()); }, [dispatch]);

  const filtered = (items as VocabRule[]).filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.eventKey.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><BookOpen size={15} /> Vocabulary Rules</span>
        <button className="btn btn-primary" onClick={() => navigate('/new')}><Plus size={13} /> New Rule</button>
      </div>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="search-input"><Search size={14} /><input placeholder="Search by name or event…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        {loading ? <div style={{ padding: 24 }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />)}</div> : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Event</th><th>Priority</th><th>Action</th><th>Hits</th><th>Last Hit</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((r: VocabRule) => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/edit/${r.id}`)}>
                  <td style={{ fontWeight: 500, color: '#f1f5f9' }}>{r.name}</td>
                  <td><span className="mono" style={{ color: '#94a3b8', fontSize: 11 }}>{r.eventKey}</span></td>
                  <td><span style={{ color: PRIORITY_COLORS[r.priority] ?? '#94a3b8', fontWeight: 600 }}>P{r.priority}</span></td>
                  <td style={{ color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.action}</td>
                  <td style={{ textAlign: 'center', color: r.hitCount > 0 ? ACCENT : '#334155' }}>{r.hitCount.toLocaleString()}</td>
                  <td style={{ color: '#475569' }}>{r.lastHitAt ? format(parseISO(r.lastHitAt), 'MMM d HH:mm') : '—'}</td>
                  <td>
                    <button className="btn-icon" title={r.active ? 'Pause' : 'Activate'} onClick={e => { e.stopPropagation(); dispatch(toggleRule(r.id)); }}>
                      {r.active ? <ToggleRight size={18} style={{ color: '#22c55e' }} /> : <ToggleLeft size={18} style={{ color: '#475569' }} />}
                    </button>
                  </td>
                  <td>
                    <button className="btn-icon" style={{ color: '#ef4444' }} onClick={e => { e.stopPropagation(); if (confirm('Delete this rule?')) dispatch(deleteRule(r.id)); }}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No vocab rules found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function RuleEditor({ isNew }: { isNew?: boolean }) {
  const navigate = useNavigate();
  const dispatch = useD();
  const { saving } = useS(s => (s as any).vocab) as any;

  const [form, setForm] = useState<Partial<VocabRule>>({
    name: '', eventKey: '', description: '', condition: '', action: '', priority: 3, active: true,
  });

  const set = (k: keyof VocabRule, v: any) => setForm(p => ({ ...p, [k]: v }));
  const save = async () => { await dispatch(saveRule({ id: null, data: form })); navigate('/'); };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="form-group"><label className="form-label">{label}</label>{children}</div>
  );

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{isNew ? 'New Vocab Rule' : 'Edit Rule'}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/')}><X size={13} /> Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={save}><Save size={13} />{saving ? 'Saving…' : 'Save Rule'}</button>
        </div>
      </div>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Rule Name"><input className="form-input" value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="qualify-premium-order" /></Field>
        <Field label="Event Key"><input className="form-input" value={form.eventKey ?? ''} onChange={e => set('eventKey', e.target.value)} placeholder="order.placed" /></Field>
        <Field label="Priority (1=highest)">
          <select className="form-input" value={form.priority} onChange={e => set('priority', Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>P{p}</option>)}
          </select>
        </Field>
        <Field label="Active">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <button className="btn-icon" onClick={() => set('active', !form.active)}>
              {form.active ? <ToggleRight size={24} style={{ color: '#22c55e' }} /> : <ToggleLeft size={24} style={{ color: '#475569' }} />}
            </button>
            <span style={{ color: form.active ? '#22c55e' : '#475569', fontSize: 13 }}>{form.active ? 'Active' : 'Inactive'}</span>
          </div>
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Description"><input className="form-input" value={form.description ?? ''} onChange={e => set('description', e.target.value)} placeholder="Describe what this rule does" /></Field>
        </div>
        <Field label="Condition (SpEL expression)">
          <textarea className="form-input" rows={4} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} value={form.condition ?? ''} onChange={e => set('condition', e.target.value)} placeholder="#payload.amount > 500 and #payload.tier == 'PREMIUM'" />
        </Field>
        <Field label="Action">
          <textarea className="form-input" rows={4} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }} value={form.action ?? ''} onChange={e => set('action', e.target.value)} placeholder="SEND_NOTIFICATION(template='premium-order-confirm')" />
        </Field>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <Sidebar />
        <header className="topbar"><div><div className="topbar-title">Vocab Rules</div><div className="topbar-subtitle">Manage vocabulary-based matching rules</div></div></header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RuleList />} />
            <Route path="/new" element={<RuleEditor isNew />} />
            <Route path="/edit/:id" element={<RuleEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
