import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getPaginated, httpService, type PaginatedResponse } from '@notify-ui/shared';
import type { DomainEntry, DomainForm } from '../../types';
import type { Reducer } from '@reduxjs/toolkit';

interface State {
  domains: DomainEntry[];
  form: DomainForm | null;
  loading: boolean;
  page: number;
  totalPages: number;
  saving: boolean;
}

export const fetchDomains = createAsyncThunk<PaginatedResponse<DomainEntry>, number | void>(
  'domains/fetch',
  (page) => getPaginated<DomainEntry>('/api/admin/domains', {
    page: page ?? 0,
    cacheKey: 'domains:list',
    ttlMs: 60_000,
  })
);

export const fetchDomainForm = createAsyncThunk(
  'domains/form',
  (id: string) => httpService.get<DomainForm>(`/api/admin/domains/${id}/form`)
);

export const saveDomainForm = createAsyncThunk(
  'domains/saveForm',
  ({ id, form }: { id: string; form: DomainForm }) =>
    httpService.put<DomainForm>(`/api/admin/domains/${id}/form`, {
      data: form, invalidateKey: 'domains:list',
      successModal: { title: 'Form saved', message: 'Domain form has been updated.', variant: 'success', autoCloseMs: 2000 }
    }
    )
);

const slice = createSlice({
  name: 'domains',
  initialState: { domains: [], form: null, loading: false, page: 0, totalPages: 1, saving: false } as State,
  reducers: {
    setForm: (s, a: PayloadAction<DomainForm | null>) => { s.form = a.payload; }
  },
  extraReducers: b => {
    b.addCase(fetchDomains.pending, s => { s.loading = true; });
    b.addCase(fetchDomains.fulfilled, (s, a) => {
      s.loading = false;
      s.domains = a.payload.content;
      s.page = a.payload.number;
      s.totalPages = a.payload.totalPages;
    });
    b.addCase(fetchDomains.rejected, s => { s.loading = false; });
    b.addCase(fetchDomainForm.fulfilled, (s, a) => { s.form = a.payload ?? null; });
    b.addCase(saveDomainForm.pending, s => { s.saving = true; });
    b.addCase(saveDomainForm.fulfilled, s => { s.saving = false; });
    b.addCase(saveDomainForm.rejected, s => { s.saving = false; });
  }
});

export const { setForm } = slice.actions;

export const reducers = { domains: slice.reducer as Reducer<unknown> };
