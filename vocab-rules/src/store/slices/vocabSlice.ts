import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { httpService } from '@notify-ui/shared';
import type { VocabRule } from '../../types';
import type { Reducer } from '@reduxjs/toolkit';

interface State { items: VocabRule[]; loading: boolean; saving: boolean; }
export const fetchRules = createAsyncThunk('vocab/fetch', () => httpService.get<VocabRule[]>('/api/admin/vocab-rules', { cacheKey: 'vocab:rules', ttlMs: 30_000 }));
export const saveRule = createAsyncThunk('vocab/save', ({ id, data }: { id: string | null; data: Partial<VocabRule> }) =>
  id ? httpService.put<VocabRule>(`/api/admin/vocab-rules/${id}`, { data, invalidateKey: 'vocab:rules', successModal: { title: 'Rule saved', message: '', variant: 'success', autoCloseMs: 2000 } })
     : httpService.post<VocabRule>('/api/admin/vocab-rules', { data, invalidateKey: 'vocab:rules', successModal: { title: 'Rule created', message: '', variant: 'success', autoCloseMs: 2000 } }));
export const deleteRule = createAsyncThunk('vocab/delete', (id: string) => httpService.delete<void>(`/api/admin/vocab-rules/${id}`, { invalidateKey: 'vocab:rules' }));
const slice = createSlice({ name: 'vocab', initialState: { items: [], loading: false, saving: false } as State, reducers: {}, extraReducers: b => {
  b.addCase(fetchRules.pending, s => { s.loading = true; });
  b.addCase(fetchRules.fulfilled, (s, a) => { s.loading = false; s.items = a.payload ?? []; });
  b.addCase(fetchRules.rejected, s => { s.loading = false; });
  b.addCase(deleteRule.fulfilled, (s, a) => { s.items = s.items.filter(r => r.id !== a.meta.arg); });
  b.addCase(saveRule.pending, s => { s.saving = true; });
  b.addCase(saveRule.fulfilled, s => { s.saving = false; });
  b.addCase(saveRule.rejected, s => { s.saving = false; });
}});
export const reducers = { vocab: slice.reducer as Reducer<unknown> };
