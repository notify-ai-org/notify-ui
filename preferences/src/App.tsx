import React, { useEffect, useRef, useState } from 'react';
import { BellOff, Check, ChevronRight, Moon, Plus, RefreshCw, Search, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { PaginationControls, PortalSidebar, portalHref } from '@notify-ui/shared';
import { Provider as ReduxProvider } from 'react-redux';
import { CHANNELS, LANGUAGE_SUGGESTIONS, channelLabels, emptyPreference, languageLabel, type Preference, type PreferenceInput } from './api';
import { store, useAppDispatch, useAppSelector } from './store';
import { loadPreferences, mutatePreference, preferencesActions } from './store/preferencesSlice';
import './styles.css';

const zones: string[] = (() => {
  try { return (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ?? []; }
  catch { return []; }
})();
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : '—';
const summary = (p: Preference) => p.optedOut ? 'All notifications paused'
  : [p.optedOutChannels.length ? `No ${p.optedOutChannels.map(c => channelLabels[c] ?? c).join(', ')}` : '',
    p.quietHoursStart && p.quietHoursEnd ? `Quiet ${p.quietHoursStart}–${p.quietHoursEnd}` : '',
    p.preferredChannel ? `Prefers ${channelLabels[p.preferredChannel] ?? p.preferredChannel}` : '',
    p.language ? languageLabel(p.language) : '']
    .filter(Boolean).join(' · ') || 'No restrictions';

// The wrapper also supplies Redux when the dev shell imports this portal directly.
export default function App() {
  return <ReduxProvider store={store}><PreferencesPortal /></ReduxProvider>;
}

function PreferencesPortal() {
  const dispatch = useAppDispatch();
  const { records, selected, query, page, totalPages, totalElements, loading, busy, error, notice, revision } =
    useAppSelector(state => state.preferences);
  const [search, setSearch] = useState(query);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { if (search !== query) dispatch(preferencesActions.setQuery(search)); }, 250);
    return () => clearTimeout(timer);
  }, [dispatch, search, query]);
  useEffect(() => {
    const controller = new AbortController();
    void dispatch(loadPreferences(controller.signal));
    return () => controller.abort();
  }, [dispatch, query, page]);

  return <div className="app-shell preferences-portal">
    <PortalSidebar />
    <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={13}/> Delivery <ChevronRight size={13}/> <strong>Recipient preferences</strong></div></header>
    <main className="main-content">
      <div className="page-heading"><div><div className="eyebrow">DELIVERY CONTROL</div><h1>Recipient preferences<span>.</span></h1><p>Honor opt-outs and quiet hours for every recipient.</p></div>
        <button className="primary" disabled={busy} onClick={() => setCreating(true)}><Plus size={16}/> Add recipient</button></div>
      {error && !creating && !removing && <div role="alert" className="banner error">{error}<a href={portalHref('login')}>Sign in</a><button onClick={() => dispatch(preferencesActions.clearError())} aria-label="Dismiss error"><X size={15}/></button></div>}
      {notice && <div role="status" className="banner success"><Check size={16}/>{notice}<button onClick={() => dispatch(preferencesActions.clearNotice())} aria-label="Dismiss notification"><X size={15}/></button></div>}
      <div className="workspace-summary"><span><strong>{loading ? '—' : totalElements}</strong> recipients with preferences</span><span><ShieldCheck size={14}/> Opt-outs always apply. Quiet hours hold back everything except critical notifications.</span><button disabled={busy || loading} onClick={() => void dispatch(loadPreferences())} aria-label="Refresh preferences"><RefreshCw size={14}/> Refresh</button></div>
      {loading && !records.length ? <div className="empty panel" role="status"><RefreshCw className="spin" size={24}/><h2>Loading preferences</h2><p>Retrieving the current tenant’s recipients.</p></div>
      : !records.length && !query && !selected ? <div className="empty-workspace panel"><div className="empty-intro"><div className="icon-tile"><UserRound size={25}/></div><h2>{error ? 'Preferences are unavailable' : 'Every recipient follows your channel policy'}</h2><p>{error ? 'Refresh when the service is available.' : 'Add a recipient by the subject ID your application sends with its events to record opt-outs, a preferred channel, or quiet hours.'}</p><button className="primary" onClick={() => setCreating(true)}><Plus size={16}/> Add recipient</button></div></div>
      : <div className="record-workspace">
        <aside className="record-list panel" aria-label="Recipients">
          <div className="list-tools"><label className="search-box"><Search size={15}/><input aria-label="Search recipients" placeholder="Find a subject ID…" value={search} onChange={e => setSearch(e.target.value)}/></label></div>
          {records.map(r => <button className={`record-row ${selected?.subjectId === r.subjectId ? 'selected' : ''}`} key={r.subjectId} disabled={busy} aria-pressed={selected?.subjectId === r.subjectId} onClick={() => dispatch(preferencesActions.select(r))}>
            <div className="icon-tile">{r.optedOut ? <BellOff size={19}/> : r.quietHoursStart ? <Moon size={19}/> : <UserRound size={19}/>}</div>
            <div><strong>{r.subjectId}</strong><span>{summary(r)}</span></div>
            <span className={`status-dot ${r.optedOut ? 'paused' : ''}`} title={r.optedOut ? 'Paused' : 'Receiving'}/></button>)}
          {!records.length && <div className="list-empty">{loading ? 'Searching…' : 'No recipients match your search.'}</div>}
          <div className="pager"><PaginationControls page={page} totalPages={totalPages} disabled={busy || loading} onChange={p => dispatch(preferencesActions.setPage(p))}/></div>
          <div className="list-footer"><ShieldCheck size={14}/> Scoped to your signed-in tenant</div>
        </aside>
        {selected && <section className="record-detail panel">
          <div className="detail-header"><div className="detail-title"><div className="icon-tile large"><UserRound size={24}/></div><div><h2>{selected.subjectId}</h2><div className="muted">Updated {date(selected.updatedAt)}</div></div></div><span className={`badge ${selected.optedOut ? '' : 'enabled'}`}><i className="status-dot"/>{selected.optedOut ? 'Paused' : 'Receiving'}</span></div>
          <div className="detail-body">
            <PreferenceForm key={`${selected.subjectId}-${revision}`} initial={selected} busy={busy}
              submit={body => void dispatch(mutatePreference({ kind: 'save', subjectId: selected.subjectId, body, created: false }))}
              footer={<button type="button" className="danger" disabled={busy} onClick={() => setRemoving(true)}><Trash2 size={14}/> Remove</button>}/>
          </div>
        </section>}
      </div>}
    </main>
    {creating && <Dialog title="Add a recipient" busy={busy} close={() => { setCreating(false); dispatch(preferencesActions.clearError()); }}>
      {error && <div role="alert" className="banner error">{error}</div>}
      <PreferenceForm initial={emptyPreference()} busy={busy} askSubject
        submit={(body, subjectId) => void dispatch(mutatePreference({ kind: 'save', subjectId: subjectId!, body, created: true })).then(ok => { if (ok) setCreating(false); })}/>
    </Dialog>}
    {removing && selected && <Dialog title="Remove these preferences?" busy={busy} close={() => { setRemoving(false); dispatch(preferencesActions.clearError()); }}>
      {error && <div role="alert" className="banner error">{error}</div>}
      <p className="dialog-copy">{selected.subjectId} will receive notifications according to your channel policy again, including any channels they opted out of.</p>
      <div className="button-row dialog-footer"><button className="secondary" disabled={busy} onClick={() => setRemoving(false)}>Keep preferences</button><button className="danger" disabled={busy} onClick={() => void dispatch(mutatePreference({ kind: 'delete', subjectId: selected.subjectId })).then(ok => { if (ok) setRemoving(false); })}>{busy ? 'Removing…' : 'Remove preferences'}</button></div>
    </Dialog>}
  </div>;
}

function PreferenceForm({ initial, busy, submit, askSubject = false, footer }: {
  initial: Preference; busy: boolean; askSubject?: boolean; footer?: React.ReactNode;
  submit: (body: PreferenceInput, subjectId?: string) => void;
}) {
  const [optedOut, setOptedOut] = useState(initial.optedOut);
  const [blocked, setBlocked] = useState<string[]>(initial.optedOutChannels);
  const [preferred, setPreferred] = useState(initial.preferredChannel ?? '');
  const toggle = (channel: string) => {
    setBlocked(current => current.includes(channel) ? current.filter(c => c !== channel) : [...current, channel]);
    if (preferred === channel) setPreferred('');
  };
  return <form onSubmit={e => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = (key: string) => String(data.get(key) ?? '').trim() || null;
    submit({ optedOut, optedOutChannels: blocked, preferredChannel: preferred || null,
      quietHoursStart: text('quietHoursStart'), quietHoursEnd: text('quietHoursEnd'), timeZone: text('timeZone'),
      language: text('language') },
      askSubject ? String(data.get('subjectId') ?? '').trim() : undefined);
  }}>
    <fieldset disabled={busy}>
      {askSubject && <div className="field-grid"><label className="field full"><span>Subject ID<em> *</em></span><input name="subjectId" required maxLength={255} autoComplete="off" spellCheck={false} placeholder="customer-42"/><small>The stable recipient identity your application sends with its events, not an email address or phone number.</small></label></div>}
      <div className="section-heading spaced"><div><h3>Consent</h3><p>Opt-outs are never overridden, including for critical notifications.</p></div></div>
      <label className="toggle-row"><input type="checkbox" checked={optedOut} onChange={e => setOptedOut(e.target.checked)}/><div><strong>Pause all notifications</strong><small>Nothing is sent to this recipient on any channel.</small></div></label>
      <div className="field spaced"><span>Opted-out channels</span><div className="check-grid" role="group" aria-label="Opted-out channels">
        {CHANNELS.map(c => <label key={c}><input type="checkbox" disabled={optedOut} checked={blocked.includes(c)} onChange={() => toggle(c)}/>{channelLabels[c]}</label>)}
      </div></div>
      <div className="field-grid spaced"><label className="field"><span>Preferred channel</span><select value={preferred} disabled={optedOut} onChange={e => setPreferred(e.target.value)}><option value="">No preference</option>{CHANNELS.filter(c => !blocked.includes(c)).map(c => <option key={c} value={c}>{channelLabels[c]}</option>)}</select><small>Guides channel selection when an event can use more than one.</small></label></div>
      <div className="section-heading spaced"><div><h3>Language</h3><p>New messages for this recipient are written in this language.</p></div></div>
      <div className="field-grid"><label className="field"><span>Template language</span><input name="language" list="languages" defaultValue={initial.language ?? ''} placeholder="Business default" autoComplete="off" spellCheck={false}/><small>A language tag such as hi, es-MX or pt-BR. Brand content from your domain settings is not translated.</small></label></div>
      <datalist id="languages">{LANGUAGE_SUGGESTIONS.map(tag => <option key={tag} value={tag}>{languageLabel(tag)}</option>)}</datalist>
      <div className="section-heading spaced"><div><h3>Quiet hours</h3><p>Non-critical notifications are planned outside this window and suppressed if they land in it.</p></div><Moon className="accent" size={21}/></div>
      <div className="field-grid">
        <label className="field"><span>Start</span><input name="quietHoursStart" type="time" defaultValue={initial.quietHoursStart ?? ''}/></label>
        <label className="field"><span>End</span><input name="quietHoursEnd" type="time" defaultValue={initial.quietHoursEnd ?? ''}/><small>A window may cross midnight, for example 22:00 to 07:00.</small></label>
        <label className="field full"><span>Time zone</span><input name="timeZone" list="time-zones" defaultValue={initial.timeZone ?? ''} placeholder="UTC" autoComplete="off" spellCheck={false}/><small>IANA name such as Asia/Kolkata. Defaults to UTC.</small></label>
      </div>
      <datalist id="time-zones">{zones.map(z => <option key={z} value={z}/>)}</datalist>
    </fieldset>
    <div className="form-footer">{footer ?? <span>Changes apply to the next notification.</span>}<button className="primary" disabled={busy}>{busy ? 'Saving…' : askSubject ? 'Add recipient' : 'Save preferences'}</button></div>
  </form>;
}

function Dialog({ title, busy, close, children }: { title: string; busy: boolean; close: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); return () => ref.current?.close(); }, []);
  return <dialog ref={ref} className="record-dialog" aria-label={title} onCancel={e => { e.preventDefault(); if (!busy) close(); }}><div className="dialog-heading"><h2>{title}</h2><button aria-label="Close dialog" disabled={busy} onClick={close}><X size={19}/></button></div>{children}</dialog>;
}
