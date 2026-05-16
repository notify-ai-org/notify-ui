import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Settings, Bell, Shield, Server, Save } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import {
  fetchSystem, fetchNotifs, fetchSecurity,
  saveSystem, saveNotifs, saveSecurity,
  patchSystem, patchNotifs, patchSecurity,
} from './store/slices/settingsSlice';
import type { SystemSettings, NotificationSettings, SecuritySettings } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(fn: (s: RootState) => T) => useSelector<RootState, T>(fn);
const ACCENT = '#64748b';
const BASE = import.meta.env.VITE_PORTAL_BASE ?? '/portals/settings/';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Settings size={20} style={{ color: '#94a3b8' }} />
        <span style={{ color: '#f1f5f9' }}>Settings</span>
      </div>
      <span className="nav-section-label">Configuration</span>
      {[{ to: '/', label: 'System', icon: Server }, { to: '/notifications', label: 'Notifications', icon: Bell }, { to: '/security', label: 'Security', icon: Shield }]
        .map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon size={15} />{label}
          </NavLink>
        ))}
    </aside>
  );
}

type FieldType = 'text' | 'number' | 'boolean' | 'select';
function SettingsSection<T extends object>({
  title, icon: Icon, data, saving, fields, onSave, onChange,
}: {
  title: string;
  icon: React.ComponentType<any>;
  data: T | null;
  saving: boolean;
  fields: Array<{ key: keyof T; label: string; type: FieldType; options?: string[] }>;
  onSave: (d: T) => void;
  onChange: (patch: Partial<T>) => void;
}) {
  if (!data) return <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>Loading settings…</div>;

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title"><Icon size={15} /> {title}</span>
        <button className="btn btn-primary" disabled={saving} onClick={() => onSave(data)}><Save size={13} />{saving ? 'Saving…' : 'Save'}</button>
      </div>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {fields.map(({ key, label, type, options }) => (
          <div key={String(key)} className="form-group">
            <label className="form-label">{label}</label>
            {type === 'boolean' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input type="checkbox" checked={Boolean(data[key])} style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                  onChange={e => onChange({ [key]: e.target.checked } as any)} />
                <span style={{ color: Boolean(data[key]) ? '#22c55e' : '#475569', fontSize: 13 }}>{Boolean(data[key]) ? 'Enabled' : 'Disabled'}</span>
              </div>
            ) : type === 'select' ? (
              <select className="form-input" value={String(data[key])} onChange={e => onChange({ [key]: e.target.value } as any)}>
                {options?.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input className="form-input" type={type === 'number' ? 'number' : 'text'} value={String(data[key])}
                onChange={e => onChange({ [key]: type === 'number' ? Number(e.target.value) : e.target.value } as any)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemPage() {
  const dispatch = useD();
  const { system, saving } = useS(s => (s as any).settings) as any;
  useEffect(() => { dispatch(fetchSystem()); }, [dispatch]);
  return <SettingsSection<SystemSettings> title="System Settings" icon={Server} data={system} saving={saving}
    onSave={d => dispatch(saveSystem(d))} onChange={p => dispatch(patchSystem(p))}
    fields={[
      { key: 'maxRetries', label: 'Max Retries', type: 'number' },
      { key: 'retryDelayMs', label: 'Retry Delay (ms)', type: 'number' },
      { key: 'captureTimeoutMs', label: 'Capture Timeout (ms)', type: 'number' },
      { key: 'notificationBatchSize', label: 'Notification Batch Size', type: 'number' },
      { key: 'logRetentionDays', label: 'Log Retention (days)', type: 'number' },
      { key: 'enableAuditLog', label: 'Audit Log', type: 'boolean' },
      { key: 'defaultLocale', label: 'Default Locale', type: 'select', options: ['en-US', 'en-GB', 'de-DE', 'fr-FR', 'ja-JP'] },
      { key: 'defaultTimezone', label: 'Default Timezone', type: 'select', options: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata', 'Asia/Tokyo'] },
    ]}
  />;
}

function NotifPage() {
  const dispatch = useD();
  const { notifications, saving } = useS(s => (s as any).settings) as any;
  useEffect(() => { dispatch(fetchNotifs()); }, [dispatch]);
  return <SettingsSection<NotificationSettings> title="Notification Settings" icon={Bell} data={notifications} saving={saving}
    onSave={d => dispatch(saveNotifs(d))} onChange={p => dispatch(patchNotifs(p))}
    fields={[
      { key: 'emailProvider', label: 'Email Provider', type: 'select', options: ['SENDGRID', 'SES', 'MAILGUN', 'SMTP'] },
      { key: 'smsProvider', label: 'SMS Provider', type: 'select', options: ['TWILIO', 'VONAGE', 'AWS_SNS'] },
      { key: 'pushProvider', label: 'Push Provider', type: 'select', options: ['FCM', 'APNS', 'ONE_SIGNAL'] },
      { key: 'maxDailyEmailsPerTenant', label: 'Max Daily Emails / Tenant', type: 'number' },
      { key: 'maxDailySmsPerTenant', label: 'Max Daily SMS / Tenant', type: 'number' },
      { key: 'rateLimitWindowMs', label: 'Rate Limit Window (ms)', type: 'number' },
    ]}
  />;
}

function SecPage() {
  const dispatch = useD();
  const { security, saving } = useS(s => (s as any).settings) as any;
  useEffect(() => { dispatch(fetchSecurity()); }, [dispatch]);
  return <SettingsSection<SecuritySettings> title="Security Settings" icon={Shield} data={security} saving={saving}
    onSave={d => dispatch(saveSecurity(d))} onChange={p => dispatch(patchSecurity(p))}
    fields={[
      { key: 'jwtExpirySeconds', label: 'JWT Expiry (seconds)', type: 'number' },
      { key: 'refreshTokenExpiryDays', label: 'Refresh Token Expiry (days)', type: 'number' },
      { key: 'maxLoginAttempts', label: 'Max Login Attempts', type: 'number' },
      { key: 'lockoutDurationMs', label: 'Lockout Duration (ms)', type: 'number' },
      { key: 'requireMfa', label: 'Require MFA', type: 'boolean' },
    ]}
  />;
}

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <Sidebar />
        <header className="topbar"><div><div className="topbar-title">Settings</div><div className="topbar-subtitle">System, notification and security configuration</div></div></header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<SystemPage />} />
            <Route path="/notifications" element={<NotifPage />} />
            <Route path="/security" element={<SecPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
