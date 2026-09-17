import React, { useEffect, useRef, useState } from 'react';
import { Activity, ArrowUpRight, Bell, Check, ChevronRight, KeyRound, Mail, MessageCircle, Plus, Power, Radio, RefreshCw, Search, Settings2, ShieldCheck, Smartphone, Webhook, X } from 'lucide-react';
import { PortalSidebar, portalHref } from '@notify-ui/shared';
import { Provider as ReduxProvider } from 'react-redux';
import { Channel, credentialMode } from './api';
import { store, useAppDispatch, useAppSelector } from './store';
import { channelsActions, loadChannels, loadTenant, loadDetails, mutateChannel } from './store/channelsSlice';
import { Field, Provider, providers, availableProviders, runtime } from './schema';
import './styles.css';

const icons: Record<string, typeof Mail> = { EMAIL:Mail, SMS:MessageCircle, WHATSAPP:Smartphone, PUSH:Bell, WEBHOOK:Webhook, IN_APP:Radio };
const providerFor = (channel: Channel) => providers.find(p => p.type === channel.type) ?? providers[0];
const date = (value?: string | null) => value ? new Date(value).toLocaleString() : 'No activity yet';
// The wrapper also supplies Redux when the dev shell imports this portal directly.
export default function App() {
  return <ReduxProvider store={store}><ChannelsPortal /></ReduxProvider>;
}

function ChannelsPortal() {
  const dispatch = useAppDispatch();
  const { channels, selectedId, loading, busy, error, notice, tenant, days, revision,
    metadata, metrics, detailsLoading, detailsError } = useAppSelector(state => state.channels);
  const [query,setQuery] = useState('');
  const [filter,setFilter] = useState('all');
  const [tab,setTab] = useState('overview');
  const [creating,setCreating] = useState<string | null>(null);
  const [revoking,setRevoking] = useState(false);
  const selected = channels.find(c => c.id === selectedId);
  const provider = selected ? providerFor(selected) : null;
  const credentialsMode = credentialMode(metadata);
  const replacingActiveCredentials = credentialsMode === 'update';
  const available = availableProviders(channels);

  useEffect(() => {
    const controller = new AbortController();
    void dispatch(loadTenant(controller.signal));
    void dispatch(loadChannels(controller.signal));
    return () => controller.abort();
  },[dispatch]);
  useEffect(() => {
    const controller = new AbortController();
    void dispatch(loadDetails(controller.signal));
    return () => controller.abort();
  },[dispatch,selectedId,days,revision]);

  const filtered = channels.filter(c => (filter === 'all' || c.enabled === (filter === 'enabled')) &&
    `${providerFor(c).label} ${c.provider} ${c.id}`.toLowerCase().includes(query.toLowerCase()));
  const enabled = channels.filter(c=>c.enabled).length;

  return <div className="app-shell channels-portal">
    <PortalSidebar />
    <header className="topbar"><div className="breadcrumb">Workspace <ChevronRight size={13}/> Delivery <ChevronRight size={13}/> <strong>Channels</strong></div><span className="tenant-pill"><span className="status-dot"/>{tenant}</span></header>
    <main className="main-content">
      <div className="page-heading"><div><div className="eyebrow">DELIVERY CONTROL</div><h1>Channels<span>.</span></h1><p>Connect your providers. Keep every delivery under control.</p></div>
        <button className="primary" disabled={busy||loading||!available.length} onClick={()=>setCreating(available[0]?.type??null)}><Plus size={16}/> New channel</button></div>
      {error && <div role="alert" className="banner error">{error}<a href={portalHref('login')}>Sign in</a><button onClick={()=>dispatch(channelsActions.clearError())} aria-label="Dismiss error"><X size={15}/></button></div>}
      {notice && <div role="status" className="banner success"><Check size={16}/>{notice}<button onClick={()=>dispatch(channelsActions.clearNotice())} aria-label="Dismiss notification"><X size={15}/></button></div>}
      <div className="workspace-summary"><span><strong>{loading?'—':channels.length}</strong> channels</span><span><i className="status-dot"/><strong>{loading?'—':enabled}</strong> enabled</span><span><i className="status-dot paused"/><strong>{loading?'—':channels.length-enabled}</strong> paused or awaiting credentials</span><button disabled={busy||loading} onClick={()=>void Promise.all([dispatch(loadChannels()),dispatch(loadDetails())])} aria-label="Refresh channels"><RefreshCw size={14}/> Refresh</button></div>
      {loading ? <div className="empty panel" role="status"><RefreshCw className="spin" size={24}/><h2>Loading your channels</h2><p>Retrieving the current tenant’s configuration.</p></div>
      : !channels.length ? <div className="empty-workspace panel"><div className="empty-intro"><div className="icon-tile"><Radio size={25}/></div><h2>{error?'Channels are unavailable':'Your next delivery starts here'}</h2><p>{error?'Refresh when the service is available.':'Choose a channel, configure its settings, and add credentials to start sending.'}</p></div><div className="provider-grid">{providers.map(p=>{const Icon=icons[p.type];return <button key={p.type} onClick={()=>setCreating(p.type)}><Icon size={23}/><strong>{p.label}</strong><span>{p.description}</span><small>Configure {p.vendor} <ArrowUpRight size={13}/></small></button>;})}</div></div>
      : <div className="channel-workspace">
        <aside className="channel-list panel" aria-label="Tenant channels"><div className="list-tools"><label className="search-box"><Search size={15}/><input aria-label="Search channels" placeholder="Find a channel…" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Filter channel status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All channels</option><option value="enabled">Enabled</option><option value="paused">Paused / unconfigured</option></select></div>
          {filtered.map(c=>{const p=providerFor(c),Icon=icons[c.type]??Radio;return <button className={`channel-row ${selectedId===c.id?'selected':''}`} key={c.id} disabled={busy} onClick={()=>{dispatch(channelsActions.selectChannel(c.id));setTab('overview');dispatch(channelsActions.clearNotice());}} aria-pressed={selectedId===c.id}><div className="icon-tile"><Icon size={19}/></div><div><strong>{p.label}</strong><span>{p.vendor} · {c.id.slice(0,8)}</span></div><span className={`status-dot ${c.enabled?'':'paused'}`} title={c.enabled?'Enabled':'Paused'}/></button>;})}
          {!filtered.length && <div className="list-empty">No channels match your filters.</div>}
          <div className="list-footer"><ShieldCheck size={14}/> Scoped to your signed-in tenant</div>
        </aside>
        {selected && provider && <section className="channel-detail panel">
          <div className="detail-header"><div className="detail-title"><div className="icon-tile large">{React.createElement(icons[selected.type]??Radio,{size:24})}</div><div><h2>{provider.label}</h2><div className="muted">{provider.vendor} <span className="separator">/</span> <code>{selected.id.slice(0,8)}</code></div></div></div><span className={`badge ${selected.enabled?'enabled':''}`}><i className="status-dot"/>{selected.enabled?'Enabled':selected.secretRef?'Paused':'Needs credentials'}</span></div>
          <nav className="detail-tabs" aria-label="Channel sections">{[['overview',Activity,'Overview'],['settings',Settings2,'Settings'],['secrets',KeyRound,'Credentials']].map(([key,Icon,label])=><button key={String(key)} aria-current={tab===key?'page':undefined} disabled={busy} onClick={()=>setTab(String(key))} className={tab===key?'active':''}>{React.createElement(Icon as typeof Activity,{size:15})}{String(label)}</button>)}</nav>
          <div className="detail-body">
            {detailsError && <div role="alert" className="banner error">{detailsError}<button onClick={()=>void dispatch(loadDetails())}>Retry</button></div>}
            {tab==='overview' && <>
              <div className="section-heading"><div><h3>Delivery performance</h3><p>Recorded delivery attempts for this channel.</p></div><select aria-label="Metrics period" value={days} onChange={e=>dispatch(channelsActions.setDays(Number(e.target.value)))}><option value={1}>Last 24 hours</option><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></div>
              <div className="stat-grid">{[['Attempts',metrics?.attempts],['Accepted',metrics?.succeeded],['Failed',metrics?.failed],['Acceptance rate',metrics?.attempts?`${Math.round(metrics.succeeded/metrics.attempts*100)}%`:null]].map(([label,value])=><div className="stat" key={label}><span>{label}</span><strong>{detailsLoading?'…':value??'—'}</strong></div>)}</div>
              <div className="activity-note"><Activity size={17}/><div><strong>{metrics?.attempts ? `Last attempt ${date(metrics.lastAttemptAt)}` : 'No recorded attempts in this period'}</strong><p>Accepted means the provider accepted the send request. Recent attempts may take a moment to appear.</p></div></div>
              <div className="section-heading spaced"><div><h3>Channel status</h3><p>{selected.enabled?'Ready to receive delivery jobs.':'Delivery is paused until this channel is enabled.'}</p></div><button className={selected.enabled?'secondary':'primary'} disabled={busy||detailsLoading||(!selected.enabled&&(!metadata?.configured||metadata.status!=='ACTIVE'))} onClick={()=>void dispatch(mutateChannel({kind:'activation',id:selected.id,enabled:!selected.enabled},selected.enabled?'Channel paused. Credentials were retained.':'Channel enabled.'))}><Power size={14}/>{selected.enabled?'Pause channel':'Enable channel'}</button></div>
              {!metadata?.configured && !detailsLoading && <button className="setup-callout" onClick={()=>setTab('secrets')}><KeyRound size={19}/><div><strong>Add credentials to enable delivery</strong><span>Securely connect this channel to {provider.vendor}.</span></div><ChevronRight size={18}/></button>}
              <dl className="details-table"><div><dt>Channel ID</dt><dd><code>{selected.id}</code></dd></div><div><dt>Credential status</dt><dd>{detailsLoading?'Loading…':metadata?.status?.replaceAll('_',' ')??'Not configured'}</dd></div><div><dt>Connector instances</dt><dd>{selected.instances}</dd></div><div><dt>Maximum attempts</dt><dd>{selected.maxAttempts}</dd></div></dl>
            </>}
            {tab==='settings' && <form key={`${selected.id}-${revision}`} onSubmit={e=>{e.preventDefault();const body=configuration(new FormData(e.currentTarget),provider);void dispatch(mutateChannel({kind:'settings',id:selected.id,body},'Channel settings saved.'));}}><div className="section-heading"><div><h3>{provider.vendor} settings</h3><p>Configuration for this channel only.</p></div></div><fieldset disabled={busy}><div className="field-grid">{provider.fields.map(f=><FieldInput key={f.key} field={f} value={selected.settings[f.key]}/>)}</div><h3 className="spaced">Delivery behavior</h3><div className="field-grid">{runtime.map(f=><FieldInput key={f.key} field={f} value={String(selected[f.key as 'instances'])}/>)}</div></fieldset><div className="form-footer"><span>Credentials are managed separately.</span><button className="primary" disabled={busy}>{busy?'Saving…':'Save settings'}</button></div></form>}
            {tab==='secrets' && <>
              <div className="section-heading"><div><h3>{replacingActiveCredentials?'Replace credentials':'Connect your provider'}</h3><p>Stored values are never displayed. Enter the complete credential set.</p></div><KeyRound className="accent" size={23}/></div>
              <div className="credential-status"><ShieldCheck size={18}/><div><strong>{detailsLoading?'Checking credentials…':metadata?.status?.replaceAll('_',' ')??'No credentials configured'}</strong><span>{metadata?.lastUpdated?`Updated ${date(metadata.lastUpdated)}`:'Add credentials to enable this channel.'}</span></div></div>
              {metadata?.status==='DELETION_PENDING' && <p className="dialog-copy">The previous credentials are retired. Add new credentials below to enable this channel now; their recovery period does not delay the new connection.</p>}
              <form key={`${selected.id}-${revision}`} autoComplete="off" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const data=new FormData(form);const credentials=Object.fromEntries(provider.secrets.map(f=>[f.key,String(data.get(f.key)??'')]).filter(([,v])=>v.trim()));form.reset();void dispatch(mutateChannel({kind:'credentials',id:selected.id,replace:replacingActiveCredentials,credentials},replacingActiveCredentials?'Credentials replaced.':'Credentials saved and channel enabled.'));}}><fieldset disabled={busy||detailsLoading||!!detailsError||credentialsMode===null}><div className="field-grid">{provider.secrets.map(f=><FieldInput key={f.key} field={f} secret/>)}</div><div className="form-footer"><span>Values are cleared after submission.</span><button className="primary" disabled={busy}>{busy?'Saving…':replacingActiveCredentials?'Replace credentials':'Save credentials & enable'}</button></div></fieldset></form>
              {selected.secretRef && <div className="credential-actions"><div><h3>Credential lifecycle</h3><p>Rotation requires provider support. Revoking credentials pauses delivery and schedules their deletion.</p></div><div className="button-row"><button className="secondary" disabled={busy||metadata?.status!=='ACTIVE'} onClick={()=>void dispatch(mutateChannel({kind:'rotate',id:selected.id},'Credential rotation requested.'))}><RefreshCw size={14}/> Request rotation</button><button className="danger" disabled={busy||metadata?.status==='DELETION_PENDING'} onClick={()=>setRevoking(true)}>Revoke credentials</button></div></div>}
            </>}
          </div>
        </section>}
      </div>}
    </main>
    {creating!==null && <Dialog title="Create a channel" busy={busy} close={()=>setCreating(null)}>{error && <div role="alert" className="banner error">{error}</div>}<CreateForm initial={creating} available={available} busy={busy||loading} submit={async (body)=>{if(await dispatch(mutateChannel({kind:'create',body},'Channel created. Add credentials to enable delivery.'))){setTab('secrets');setCreating(null);}}}/></Dialog>}
    {revoking&&selected && <Dialog title="Revoke channel credentials?" busy={busy} close={()=>setRevoking(false)}>{error && <div role="alert" className="banner error">{error}</div>}<p className="dialog-copy">This pauses {provider?.label} delivery and schedules the stored credentials for deletion. To pause delivery while keeping credentials, use Pause channel instead.</p><div className="button-row dialog-footer"><button className="secondary" disabled={busy} onClick={()=>setRevoking(false)}>Keep credentials</button><button className="danger" disabled={busy} onClick={()=>void dispatch(mutateChannel({kind:'revoke',id:selected.id},'Credentials revoked. Channel delivery is paused.')).then(saved=>{if(saved)setRevoking(false);})}>{busy?'Revoking…':'Revoke credentials'}</button></div></Dialog>}
  </div>;
}

function FieldInput({field:f,value,secret=false}:{field:Field;value?:string;secret?:boolean}) {
  return <label className={`field ${f.type==='textarea'?'full':''}`}><span>{f.label}{f.required&&<em> *</em>}{!f.required&&secret&&<small> Optional</small>}</span>
    {f.type==='boolean'?<select name={f.key} defaultValue={value??f.initial??'false'}><option value="true">Enabled</option><option value="false">Disabled</option></select>
    :f.type==='textarea'?<textarea name={f.key} required={f.required} rows={6} autoComplete="off" spellCheck={false} defaultValue={value} placeholder="Paste service account JSON"/>
    :<input name={f.key} type={secret?'password':f.type??'text'} autoComplete={secret?'new-password':'off'} required={f.required||f.type==='number'} min={f.min} max={f.max} step={f.type==='number'?1:undefined} defaultValue={value??f.initial??''} spellCheck={false}/>}
    {f.hint&&<small>{f.hint}</small>}</label>;
}
function configuration(data:FormData,provider:Provider) {
  return { type:provider.type,provider:provider.provider,settings:Object.fromEntries(provider.fields.map(f=>[f.key,String(data.get(f.key)??'')]).filter(([,v])=>v!=='')),...Object.fromEntries(runtime.map(f=>[f.key,Number(data.get(f.key))])) };
}
function CreateForm({initial,available,busy,submit}:{initial:string;available:Provider[];busy:boolean;submit:(body:unknown)=>Promise<void>}) {
  const [type,setType]=useState(initial);const provider=available.find(p=>p.type===type)??available[0];
  if (!provider) return <p className="dialog-copy">All channel types are already configured. Manage settings and credentials on the existing channels.</p>;
  return <form onSubmit={e=>{e.preventDefault();void submit(configuration(new FormData(e.currentTarget),provider));}}><fieldset disabled={busy}><label className="field"><span>Channel type</span><select value={provider.type} onChange={e=>setType(e.target.value)}>{available.map(p=><option key={p.type} value={p.type}>{p.label} · {p.vendor}</option>)}</select></label><p className="dialog-copy">{provider.description} Credentials are added in the next step.</p><div className="field-grid" key={type}>{provider.fields.map(f=><FieldInput key={f.key} field={f}/>)}</div><details className="advanced"><summary>Delivery behavior</summary><div className="field-grid">{runtime.map(f=><FieldInput key={f.key} field={f}/>)}</div></details></fieldset><div className="dialog-footer"><button className="primary" disabled={busy}>{busy?'Creating…':'Create channel'}<ChevronRight size={14}/></button></div></form>;
}
function Dialog({title,busy,close,children}:{title:string;busy:boolean;close:()=>void;children:React.ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();return ()=>ref.current?.close();},[]);
  return <dialog ref={ref} className="channel-dialog" aria-label={title} onCancel={e=>{e.preventDefault();if(!busy)close();}}><div className="dialog-heading"><h2>{title}</h2><button aria-label="Close dialog" disabled={busy} onClick={close}><X size={19}/></button></div>{children}</dialog>;
}
