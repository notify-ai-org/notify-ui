import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { getPaginated, httpService, type PaginatedResponse } from '@notify-ui/shared';
import type { VocabRule } from '../../types';

interface State {
  items: VocabRule[];
  loading: boolean;
  page: number;
  totalPages: number;
  saving: boolean;
}

const initialState: State = {
  items: [],
  loading: false,
  page: 0,
  totalPages: 1,
  saving: false,
};

export const fetchRules = createAsyncThunk<PaginatedResponse<VocabRule>, number | void>(
  'vocab/fetch',
  (page) => getPaginated<VocabRule>('/api/admin/vocab-rules', {
    page: page ?? 0,
    cacheKey: 'vocab:rules',
    ttlMs: 30_000,
  }),
);

export const saveRule = createAsyncThunk(
  'vocab/save',
  ({ id, data }: { id: string | null; data: Partial<VocabRule> }) => {
    const options = {
      data,
      invalidateKey: 'vocab:rules',
      successModal: {
        title: id ? 'Rule saved' : 'Rule created',
        message: '',
        variant: 'success' as const,
        autoCloseMs: 2000,
      },
    };

    return id
      ? httpService.put<VocabRule>(`/api/admin/vocab-rules/${id}`, options)
      : httpService.post<VocabRule>('/api/admin/vocab-rules', options);
  },
);

export const deleteRule = createAsyncThunk(
  'vocab/delete',
  (id: string) => httpService.delete<void>(`/api/admin/vocab-rules/${id}`, {
    invalidateKey: 'vocab:rules',
  }),
);

const slice = createSlice({
  name: 'vocab',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchRules.pending, state => {
      state.loading = true;
    });
    builder.addCase(fetchRules.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.content;
      state.page = action.payload.number;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(fetchRules.rejected, state => {
      state.loading = false;
    });
    builder.addCase(deleteRule.fulfilled, (state, action) => {
      state.items = state.items.filter(rule => rule.id !== action.meta.arg);
    });
    builder.addCase(saveRule.pending, state => {
      state.saving = true;
    });
    builder.addCase(saveRule.fulfilled, state => {
      state.saving = false;
    });
    builder.addCase(saveRule.rejected, state => {
      state.saving = false;
    });
  },
});

export const reducers = { vocab: slice.reducer as Reducer<unknown> };
