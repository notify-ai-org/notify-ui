import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getPaginated, httpService, type PaginatedResponse } from '@notify-ui/shared';
import type { Template, TemplateValidationResult } from '../../types';
import type { Reducer } from '@reduxjs/toolkit';

const TEMPLATES_API = '/api/admin/templates-schedules/templates';

type BackendTemplate = {
  id?: string;
  channel?: string;
  subject?: string | null;
  template?: string | null;
  eventType?: string | null;
  eventName?: string | null;
  createdAt?: string;
  updatedAt?: string;
  validated?: boolean;
};

type BackendTemplateDetail = {
  template: BackendTemplate;
  resolvedSubject?: string | null;
  resolvedTemplate?: string | null;
};

interface TemplatesState {
  items: Template[];
  selected: Template | null;
  loading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  saving: boolean;
  validation: TemplateValidationResult | null;
  validating: boolean;
}

function toTemplate(dto: BackendTemplate, resolved?: Pick<BackendTemplateDetail, 'resolvedSubject' | 'resolvedTemplate'>): Template {
  const eventKey = dto.eventName || dto.eventType || '';
  return {
    id: dto.id ?? '',
    name: eventKey || `${dto.channel ?? 'Template'} template`,
    channel: (dto.channel ?? 'EMAIL') as Template['channel'],
    status: dto.validated ? 'ACTIVE' : 'DRAFT',
    subject: dto.subject ?? null,
    body: dto.template ?? '',
    resolvedBody: resolved?.resolvedTemplate ?? undefined,
    resolvedSubject: resolved?.resolvedSubject ?? undefined,
    variables: [],
    version: 1,
    eventKey,
    createdAt: dto.createdAt ?? new Date(0).toISOString(),
    updatedAt: dto.updatedAt ?? dto.createdAt ?? new Date(0).toISOString(),
  };
}

function toBackendTemplate(template: Partial<Template>): BackendTemplate {
  return {
    id: template.id,
    channel: template.channel,
    subject: template.subject ?? '',
    template: template.body ?? '',
    eventName: template.eventKey,
    eventType: template.eventKey,
  };
}

export const fetchTemplates = createAsyncThunk<PaginatedResponse<Template>, number | void>('templates/fetch', (page) =>
  getPaginated<BackendTemplate>(TEMPLATES_API, { page: page ?? 0, cacheKey: 'templates:list', ttlMs: 30_000 })
    .then(result => ({ ...result, content: result.content.map(toTemplate) })),
);

export const fetchTemplate = createAsyncThunk('templates/fetchOne', (id: string) =>
  httpService
    .get<BackendTemplateDetail>(`${TEMPLATES_API}/${id}`, { ttlMs: 0 })
    .then(result => toTemplate(result.template, result)),
);

export const saveTemplate = createAsyncThunk('templates/save', ({ id, data }: { id: string | null; data: Partial<Template> }) =>
  httpService
    .post<BackendTemplate>(TEMPLATES_API, {
      data: toBackendTemplate({ ...data, id: id ?? data.id }),
      invalidateKey: 'templates:list',
      successModal: {
        title: id ? 'Template saved' : 'Template created',
        message: id ? 'Changes have been persisted.' : 'New template is ready.',
        variant: 'success',
        autoCloseMs: 2000,
      },
    })
    .then(response => ({ ...response, data: toTemplate(response.data) })),
);

export const deleteTemplate = createAsyncThunk('templates/delete', (id: string) =>
  httpService.delete<void>(`${TEMPLATES_API}/${id}`, { invalidateKey: 'templates:list' }),
);

export const validateTemplate = createAsyncThunk('templates/validate', (body: string) =>
  httpService.post<TemplateValidationResult>('/api/admin/templates/validate', { data: { body } }),
);

const slice = createSlice({
  name: 'templates',
  initialState: { items: [], selected: null, loading: false, page: 0, totalPages: 1, totalElements: 0, saving: false, validation: null, validating: false } as TemplatesState,
  reducers: {
    setSelected: (s, a: PayloadAction<Template | null>) => { s.selected = a.payload; },
    clearValidation: (s) => { s.validation = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchTemplates.pending, (s) => { s.loading = true; });
    b.addCase(fetchTemplates.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload.content;
      s.page = a.payload.number;
      s.totalPages = a.payload.totalPages;
      s.totalElements = a.payload.totalElements;
    });
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
