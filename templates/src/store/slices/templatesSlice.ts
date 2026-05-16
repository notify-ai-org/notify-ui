import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { httpService } from '@notify-ui/shared';
import type { Template, TemplateValidationResult } from '../../types';
import type { Reducer } from '@reduxjs/toolkit';

interface TemplatesState {
  items: Template[];
  selected: Template | null;
  loading: boolean;
  saving: boolean;
  validation: TemplateValidationResult | null;
  validating: boolean;
}

export const fetchTemplates = createAsyncThunk('templates/fetch', () =>
  httpService.get<Template[]>('/api/admin/templates', { cacheKey: 'templates:list', ttlMs: 30_000 }),
);

export const fetchTemplate = createAsyncThunk('templates/fetchOne', (id: string) =>
  httpService.get<Template>(`/api/admin/templates/${id}`),
);

export const saveTemplate = createAsyncThunk('templates/save', ({ id, data }: { id: string | null; data: Partial<Template> }) =>
  id
    ? httpService.put<Template>(`/api/admin/templates/${id}`, { data, invalidateKey: 'templates:list', successModal: { title: 'Template saved', message: 'Changes have been persisted.', variant: 'success', autoCloseMs: 2000 } })
    : httpService.post<Template>('/api/admin/templates', { data, invalidateKey: 'templates:list', successModal: { title: 'Template created', message: 'New template is ready.', variant: 'success', autoCloseMs: 2000 } }),
);

export const deleteTemplate = createAsyncThunk('templates/delete', (id: string) =>
  httpService.delete<void>(`/api/admin/templates/${id}`, { invalidateKey: 'templates:list' }),
);

export const validateTemplate = createAsyncThunk('templates/validate', (body: string) =>
  httpService.post<TemplateValidationResult>('/api/admin/templates/validate', { data: { body } }),
);

const slice = createSlice({
  name: 'templates',
  initialState: { items: [], selected: null, loading: false, saving: false, validation: null, validating: false } as TemplatesState,
  reducers: {
    setSelected: (s, a: PayloadAction<Template | null>) => { s.selected = a.payload; },
    clearValidation: (s) => { s.validation = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchTemplates.pending, (s) => { s.loading = true; });
    b.addCase(fetchTemplates.fulfilled, (s, a) => { s.loading = false; s.items = a.payload ?? []; });
    b.addCase(fetchTemplates.rejected, (s) => { s.loading = false; });
    b.addCase(fetchTemplate.fulfilled, (s, a) => { s.selected = a.payload ?? null; });
    b.addCase(saveTemplate.pending, (s) => { s.saving = true; });
    b.addCase(saveTemplate.fulfilled, (s) => { s.saving = false; });
    b.addCase(saveTemplate.rejected, (s) => { s.saving = false; });
    b.addCase(deleteTemplate.fulfilled, (s, a) => { s.items = s.items.filter(t => t.id !== a.meta.arg); });
    b.addCase(validateTemplate.pending, (s) => { s.validating = true; s.validation = null; });
    b.addCase(validateTemplate.fulfilled, (s, a) => { s.validating = false; s.validation = (a.payload as any) ?? null; });
    b.addCase(validateTemplate.rejected, (s) => { s.validating = false; });
  },
});

export const { setSelected, clearValidation } = slice.actions;
export const reducers = { templates: slice.reducer as Reducer<unknown> };
