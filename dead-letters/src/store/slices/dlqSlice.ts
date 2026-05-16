import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { httpService } from '@notify-ui/shared';
import type { DeadLetterEntry } from '../../types';
import type { Reducer } from '@reduxjs/toolkit';

interface State { items: DeadLetterEntry[]; loading: boolean; page: number; totalPages: number; retrying: string[]; }
export const fetchDLQ = createAsyncThunk('dlq/fetch', ({ page, status }: { page: number; status: string }) =>
  httpService.get<{ content: DeadLetterEntry[]; totalPages: number }>('/api/admin/dead-letters', { params: { page, size: 20, status: status || undefined } }));
export const retryEntry = createAsyncThunk('dlq/retry', (id: string) => httpService.post<DeadLetterEntry>(`/api/admin/dead-letters/${id}/retry`, { invalidateKey: 'dlq:list', successModal: { title: 'Retry triggered', message: 'Entry re-queued for processing.', variant: 'success', autoCloseMs: 2000 } }));
export const discardEntry = createAsyncThunk('dlq/discard', (id: string) => httpService.patch<DeadLetterEntry>(`/api/admin/dead-letters/${id}/discard`, { invalidateKey: 'dlq:list' }));
const slice = createSlice({ name: 'dlq', initialState: { items: [], loading: false, page: 0, totalPages: 1, retrying: [] } as State,
  reducers: { setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; } },
  extraReducers: b => {
    b.addCase(fetchDLQ.pending, s => { s.loading = true; });
    b.addCase(fetchDLQ.fulfilled, (s, a) => { s.loading = false; if (a.payload) { s.items = a.payload.content; s.totalPages = a.payload.totalPages; } });
    b.addCase(fetchDLQ.rejected, s => { s.loading = false; });
    b.addCase(retryEntry.pending, (s, a) => { s.retrying.push(a.meta.arg); });
    b.addCase(retryEntry.fulfilled, (s, a) => { s.retrying = s.retrying.filter(id => id !== a.meta.arg); if (a.payload?.data) { const idx = s.items.findIndex(e => e.id === a.meta.arg); if (idx !== -1) s.items[idx] = a.payload.data; } });
    b.addCase(discardEntry.fulfilled, (s, a) => { const idx = s.items.findIndex(e => e.id === a.meta.arg); if (idx !== -1) s.items[idx].status = 'DISCARDED'; });
  }});
export const { setPage: setDLQPage } = slice.actions;
export const reducers = { dlq: slice.reducer as Reducer<unknown> };
