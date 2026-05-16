import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { httpService } from '@notify-ui/shared';
import type { SystemSettings, NotificationSettings, SecuritySettings } from '../../types';
import type { Reducer } from '@reduxjs/toolkit';

interface State { system: SystemSettings | null; notifications: NotificationSettings | null; security: SecuritySettings | null; loading: boolean; saving: boolean; }
export const fetchSystem = createAsyncThunk('settings/system', () => httpService.get<SystemSettings>('/api/admin/settings/system'));
export const fetchNotifs = createAsyncThunk('settings/notifs', () => httpService.get<NotificationSettings>('/api/admin/settings/notifications'));
export const fetchSecurity = createAsyncThunk('settings/security', () => httpService.get<SecuritySettings>('/api/admin/settings/security'));
export const saveSystem = createAsyncThunk('settings/saveSystem', (d: SystemSettings) => httpService.put<SystemSettings>('/api/admin/settings/system', { data: d, successModal: { title: 'System settings saved', message: '', variant: 'success', autoCloseMs: 2000 } }));
export const saveNotifs = createAsyncThunk('settings/saveNotifs', (d: NotificationSettings) => httpService.put<NotificationSettings>('/api/admin/settings/notifications', { data: d, successModal: { title: 'Notification settings saved', message: '', variant: 'success', autoCloseMs: 2000 } }));
export const saveSecurity = createAsyncThunk('settings/saveSecurity', (d: SecuritySettings) => httpService.put<SecuritySettings>('/api/admin/settings/security', { data: d, successModal: { title: 'Security settings saved', message: '', variant: 'success', autoCloseMs: 2000 } }));
const slice = createSlice({ name: 'settings', initialState: { system: null, notifications: null, security: null, loading: false, saving: false } as State, reducers: {
  patchSystem: (s, a: PayloadAction<Partial<SystemSettings>>) => { if (s.system) Object.assign(s.system, a.payload); },
  patchNotifs: (s, a: PayloadAction<Partial<NotificationSettings>>) => { if (s.notifications) Object.assign(s.notifications, a.payload); },
  patchSecurity: (s, a: PayloadAction<Partial<SecuritySettings>>) => { if (s.security) Object.assign(s.security, a.payload); },
}, extraReducers: b => {
  [fetchSystem, fetchNotifs, fetchSecurity].forEach(t => b.addCase(t.pending, s => { s.loading = true; }));
  b.addCase(fetchSystem.fulfilled, (s, a) => { s.loading = false; s.system = a.payload ?? null; });
  b.addCase(fetchNotifs.fulfilled, (s, a) => { s.loading = false; s.notifications = a.payload ?? null; });
  b.addCase(fetchSecurity.fulfilled, (s, a) => { s.loading = false; s.security = a.payload ?? null; });
  [saveSystem, saveNotifs, saveSecurity].forEach(t => { b.addCase(t.pending, s => { s.saving = true; }); b.addCase(t.fulfilled, s => { s.saving = false; }); b.addCase(t.rejected, s => { s.saving = false; }); });
}});
export const { patchSystem, patchNotifs, patchSecurity } = slice.actions;
export const reducers = { settings: slice.reducer as Reducer<unknown> };
