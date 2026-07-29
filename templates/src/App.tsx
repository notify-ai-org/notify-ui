import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { PaginationControls, PortalSidebar, ProfileMenu } from '@notify-ui/shared';
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

const ACCENT = '#facc15';
const CHANNEL_COLORS: Record<TemplateChannel, string> = {
  EMAIL: '#facc15', SMS: '#22c55e', PUSH: '#f59e0b', WEBHOOK: '#ef4444', IN_APP: '#fde047',
};

const configuredBase = import.meta.env.VITE_PORTAL_BASE;
const defaultBase =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/portals/templates')
    ? '/portals/templates/'
    : '/';
const BASE =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? undefined
    : configuredBase ?? defaultBase;

/* ── Templates list ── */
function TemplateList() {
  const dispatch = useAppDispatch();
  const { items, loading, page, totalPages } = useAppSelector(s => (s as any).templates);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<TemplateChannel | 'ALL'>('ALL');
  const [eventInfo, setEventInfo] = useState<Template | null>(null);
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
        {loading ? (
          <div style={{ padding: 24 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="skeleton"
                style={{ height: 40, marginBottom: 8, borderRadius: 6 }}
              />
            ))}
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Event</th><th>Channel</th><th>Subject</th><th>Description</th><th>Created At</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((t: Template) => (
                <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/edit/${t.id}`)}>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ padding: 0, border: 0, color: '#fde047' }}
                      onClick={event => {
                        event.stopPropagation();
                        setEventInfo(t);
                      }}
                    >
                      {t.eventKey}
                    </button>
                  </td>
                  <td><span className="badge" style={{ background: `${CHANNEL_COLORS[t.channel]}22`, color: CHANNEL_COLORS[t.channel] }}>{t.channel}</span></td>
                  <td>{t.subject || '—'}</td>
                  <td style={{ maxWidth: 250, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#94a3b8' }}>{t.body || t.name}</td>
                  <td style={{ color: '#475569' }}>{format(parseISO(t.createdAt), 'MMM d, HH:mm')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn-icon" title="View template" onClick={e => { e.stopPropagation(); navigate(`/edit/${t.id}`); }}><Eye size={13} /></button>
                      <button className="btn-icon" title="Delete" style={{ color: '#ef4444' }} onClick={e => handleDelete(e, t.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>No templates found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <PaginationControls
        page={page}
        totalPages={totalPages}
        disabled={loading}
        onChange={nextPage => dispatch(fetchTemplates(nextPage))}
      />
      {eventInfo && <div className="modal-overlay" onClick={() => setEventInfo(null)}>
        <div className="modal-box" onClick={event => event.stopPropagation()}>
          <div className="modal-header">
            <span className="modal-title">Event details</span>
            <button className="btn-icon" onClick={() => setEventInfo(null)}><X size={15} /></button>
          </div>
          <div className="modal-body" style={{ display: 'grid', gap: 10, color: '#d0c9a8' }}>
            <div><span className="form-label">Event</span>
              <div className="mono">{eventInfo.eventKey}</div>
            </div>
            <div><span className="form-label">Template</span>
              <div>{eventInfo.name}</div>
            </div>
            <div>
              <span className="form-label">Channel</span>
              <div>{eventInfo.channel}</div>
            </div>
            <div>
              <span className="form-label">Description</span><div>{eventInfo.body || 'No description available.'}</div>
            </div>
          </div></div></div>}
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

  useEffect(() => {
    if (selected && !isNew) {
      setForm({
        ...selected,
        body: selected.channel === 'EMAIL' ? beautifyHtml(selected.body) : selected.body,
      });
    }
  }, [selected, isNew]);

  const set = (k: keyof Template, v: any) => setForm(prev => ({
    ...prev,
    [k]: v,
    ...(k === 'body' ? { resolvedBody: undefined } : {}),
    ...(k === 'subject' ? { resolvedSubject: undefined } : {}),
  }));

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
            <Field label="Subject">
              <input
                className="form-input"
                value={form.subject ?? ''}
                onChange={event => set('subject', event.target.value)}
                placeholder="Order {{orderId}} confirmed"
              />
            </Field>
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
            <div style={{ display: 'flex', gap: 8 }}>
              {form.channel === 'EMAIL' && (
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: 12 }}
                  onClick={() => set('body', beautifyHtml(form.body ?? ''))}
                >
                  Beautify HTML
                </button>
              )}
              <button className="btn btn-ghost" style={{ fontSize: 12 }} disabled={validating} onClick={() => dispatch(validateTemplate(form.body ?? ''))}>
                <CheckCircle size={13} />{validating ? 'Validating…' : 'Validate'}
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {form.channel === 'EMAIL' ? (
              <HtmlCodeEditor
                value={form.body ?? ''}
                onChange={value => { set('body', value); dispatch(clearValidation()); }}
              />
            ) : (
              <textarea
                value={form.body ?? ''}
                onChange={event => { set('body', event.target.value); dispatch(clearValidation()); }}
                style={{
                  width: '100%', minHeight: 320, background: 'transparent', border: 'none',
                  color: '#e2e8f0', fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                  padding: 16, outline: 'none', resize: 'vertical',
                }}
                placeholder="Hello {{firstName}}, your order {{orderId}} has been confirmed."
              />
            )}
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
                    <span key={v} style={{ background: 'rgba(250,204,21,0.12)', color: '#fde047', padding: '2px 8px', borderRadius: 20, fontSize: 11 }}>{'{{' + v + '}}'}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live preview */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Eye size={15} /> Resolved Preview</span>
            {form.resolvedBody != null && <span className="badge badge-active">Domain content applied</span>}
          </div>
          <div className="card-body">
            {form.resolvedSubject && form.channel === 'EMAIL' && (
              <div style={{ marginBottom: 12, color: '#d0c9a8', fontSize: 13 }}>
                <strong>Subject:</strong> {form.resolvedSubject}
              </div>
            )}
            <TemplatePreview body={form.resolvedBody ?? form.body ?? ''} channel={form.channel} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HtmlCodeEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const gutterRef = useRef<HTMLPreElement>(null);
  const lineCount = Math.max(value.split('\n').length, 1);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr)', minHeight: 380, background: '#090b10' }}>
      <pre
        ref={gutterRef}
        aria-hidden="true"
        style={{
          margin: 0,
          padding: '16px 10px',
          overflow: 'hidden',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          color: '#475569',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          textAlign: 'right',
          userSelect: 'none',
        }}
      >
        {Array.from({ length: lineCount }, (_, index) => index + 1).join('\n')}
      </pre>
      <textarea
        aria-label="Email template HTML"
        spellCheck={false}
        value={value}
        onChange={event => onChange(event.target.value)}
        onScroll={event => {
          if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop;
        }}
        style={{
          width: '100%',
          minHeight: 380,
          margin: 0,
          padding: 16,
          resize: 'vertical',
          border: 0,
          outline: 'none',
          background: 'transparent',
          color: '#e2e8f0',
          caretColor: '#facc15',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          tabSize: 2,
          whiteSpace: 'pre',
          overflow: 'auto',
        }}
        placeholder={'<!doctype html>\n<html>\n  <body>\n    <h1>${BUSINESS_NAME}</h1>\n  </body>\n</html>'}
      />
    </div>
  );
}

function TemplatePreview({ body, channel }: { body: string; channel?: TemplateChannel }) {
  if (!body.trim()) return <div style={{ color: '#334155', fontSize: 12 }}>Template body will appear here…</div>;
  if (channel === 'EMAIL' || looksLikeHtml(body)) {
    return (
      <iframe
        title="Template HTML preview"
        sandbox=""
        srcDoc={body}
        style={{
          width: '100%',
          minHeight: 360,
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#ffffff',
        }}
      />
    );
  }
  return <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' as const }}>{body}</pre>;
}

function looksLikeHtml(value: string) {
  return /<!doctype html|<html[\s>]|<body[\s>]|<\/?[a-z][\s\S]*>/i.test(value);
}

function beautifyHtml(value: string) {
  if (!looksLikeHtml(value)) return value;

  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
    'param', 'source', 'track', 'wbr',
  ]);
  const lines = value.trim().replace(/>\s*</g, '>\n<').split('\n');
  let depth = 0;

  return lines.map(rawLine => {
    const line = rawLine.trim();
    const startsWithClosingTag = /^<\//.test(line);
    const outputDepth = startsWithClosingTag ? Math.max(depth - 1, 0) : depth;
    const openingTags = Array.from(line.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi))
      .filter(match => !match[0].startsWith('</') && !match[0].endsWith('/>') && !voidElements.has(match[1].toLowerCase()))
      .length;
    const closingTags = Array.from(line.matchAll(/<\/([a-z][\w:-]*)\s*>/gi)).length;
    depth = Math.max(depth + openingTags - closingTags, 0);
    return `${'  '.repeat(outputDepth)}${line}`;
  }).join('\n');
}

/* ── App ── */
export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <PortalSidebar />
        <header className="topbar">
          <div><div className="topbar-title">Templates</div><div className="topbar-subtitle">Manage notification templates</div></div>
          <ProfileMenu />
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
