import React, { useEffect, useRef, useState } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { httpService } from '../services/httpService';
import { redirectToPortal } from '../navigation/portalNavigation';

type Profile = { email: string; tier: string; clientId: string; tenantId: string };

/** Compact identity control shared by portal top bars. */
export function ProfileMenu(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || profile) return;
    void httpService.get<Profile>('/api/admin/auth/profile', { ttlMs: 0 })
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [open, profile]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const logout = async () => {
    const accessToken = document.cookie.match(/notify_access_token=([^;]+)/)?.[1] ?? '';
    const refreshToken = document.cookie.match(/notify_refresh_token=([^;]+)/)?.[1] ?? '';
    try { await httpService.post('/api/admin/auth/logout', { data: { accessToken, refreshToken }, successModal: null }); } catch { /* local logout still proceeds */ }
    document.cookie = 'notify_access_token=; Max-Age=0; path=/';
    document.cookie = 'notify_refresh_token=; Max-Age=0; path=/';
    redirectToPortal('login');
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn-icon" aria-label="Open profile menu" title="Profile" onClick={() => setOpen(value => !value)}>
        <UserRound size={17} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 30, width: 270, background: '#11110d', border: '1px solid rgba(250,204,21,.55)', boxShadow: '0 16px 36px rgba(0,0,0,.42)', padding: 14 }}>
          <div style={{ color: '#fde047', fontWeight: 700, marginBottom: 12 }}>Account</div>
          {profile ? (
            <div style={{ display: 'grid', gap: 9, color: '#d0c9a8', fontSize: 12 }}>
              <ProfileRow label="Email" value={profile.email} />
              <ProfileRow label="Tier" value={profile.tier} />
              <ProfileRow label="Client ID" value={profile.clientId || 'Not assigned'} />
              <ProfileRow label="Tenant ID" value={profile.tenantId} />
            </div>
          ) : <div style={{ color: '#8d855f', fontSize: 12 }}>Profile details are unavailable.</div>}
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16, justifyContent: 'center', color: '#fde047', borderColor: 'rgba(250,204,21,.6)' }} onClick={() => void logout()}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div><div style={{ color: '#8d855f', fontSize: 10, textTransform: 'uppercase' }}>{label}</div><div style={{ overflowWrap: 'anywhere' }}>{value}</div></div>;
}
