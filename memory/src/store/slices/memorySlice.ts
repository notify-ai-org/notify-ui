import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { httpService } from '@notify-ui/shared';
import type { Fact, MemoryLog, ExpiryConfig } from '../../types';
import type { Reducer } from '@reduxjs/toolkit';

interface FactsState { items: Fact[]; loading: boolean; page: number; totalPages: number; }
interface MemLogsState { items: MemoryLog[]; loading: boolean; page: number; totalPages: number; }
interface ExpiryState { config: ExpiryConfig | null; loading: boolean; saving: boolean; }

export const fetchFacts = createAsyncThunk('facts/fetch', ({ page, tenant }: { page: number; tenant: string }) =>
  httpService.get<{ content: Fact[]; totalPages: number }>('/api/admin/memory/facts', { params: { page, size: 20, tenant: tenant || undefined } }),
);
export const deleteFact = createAsyncThunk('facts/delete', (id: string) =>
  httpService.delete<void>(`/api/admin/memory/facts/${id}`, { invalidateKey: 'memory:facts' }),
);
export const fetchMemoryLogs = createAsyncThunk('memLogs/fetch', (page: number) =>
  httpService.get<{ content: MemoryLog[]; totalPages: number }>('/api/admin/memory/logs', { params: { page, size: 20 } }),
);
export const fetchExpiryConfig = createAsyncThunk('expiry/fetch', (tenantId: string) =>
  httpService.get<ExpiryConfig>(`/api/admin/memory/expiry/${tenantId}`, { cacheKey: `expiry:${tenantId}` }),
);
export const saveExpiryConfig = createAsyncThunk('expiry/save', (cfg: ExpiryConfig) =>
  httpService.put<ExpiryConfig>(`/api/admin/memory/expiry/${cfg.tenantId}`, {
    data: cfg, invalidateKey: `expiry:${cfg.tenantId}`,
    successModal: { title: 'Expiry config saved', message: 'Updated for tenant.', variant: 'success', autoCloseMs: 2000 },
  }),
);

const factsSlice = createSlice({
  name: 'facts', initialState: { items: [], loading: false, page: 0, totalPages: 1 } as FactsState,
  reducers: { setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; } },
  extraReducers: b => {
    b.addCase(fetchFacts.pending, s => { s.loading = true; });
    b.addCase(fetchFacts.fulfilled, (s, a) => { s.loading = false; if (a.payload) { s.items = a.payload.content; s.totalPages = a.payload.totalPages; } });
    b.addCase(fetchFacts.rejected, s => { s.loading = false; });
    b.addCase(deleteFact.fulfilled, (s, a) => { s.items = s.items.filter(f => f.id !== a.meta.arg); });
  },
});
const memLogsSlice = createSlice({
  name: 'memLogs', initialState: { items: [], loading: false, page: 0, totalPages: 1 } as MemLogsState,
  reducers: { setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; } },
  extraReducers: b => {
    b.addCase(fetchMemoryLogs.pending, s => { s.loading = true; });
    b.addCase(fetchMemoryLogs.fulfilled, (s, a) => { s.loading = false; if (a.payload) { s.items = a.payload.content; s.totalPages = a.payload.totalPages; } });
    b.addCase(fetchMemoryLogs.rejected, s => { s.loading = false; });
  },
});
const expirySlice = createSlice({
  name: 'expiry', initialState: { config: null, loading: false, saving: false } as ExpiryState,
  reducers: { updateConfig: (s, a: PayloadAction<Partial<ExpiryConfig>>) => { if (s.config) Object.assign(s.config, a.payload); } },
  extraReducers: b => {
    b.addCase(fetchExpiryConfig.pending, s => { s.loading = true; });
    b.addCase(fetchExpiryConfig.fulfilled, (s, a) => { s.loading = false; s.config = a.payload ?? null; });
    b.addCase(saveExpiryConfig.pending, s => { s.saving = true; });
    b.addCase(saveExpiryConfig.fulfilled, s => { s.saving = false; });
    b.addCase(saveExpiryConfig.rejected, s => { s.saving = false; });
  },
});

export const { setPage: setFactsPage } = factsSlice.actions;
export const { setPage: setMemLogsPage } = memLogsSlice.actions;
export const { updateConfig } = expirySlice.actions;

export const reducers = {
  facts: factsSlice.reducer as Reducer<unknown>,
  memLogs: memLogsSlice.reducer as Reducer<unknown>,
  expiry: expirySlice.reducer as Reducer<unknown>,
};
