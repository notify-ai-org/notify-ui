import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { httpService } from '@notify-ui/shared';
import type { VocabRule } from '../../types';

interface State {
  items: VocabRule[];
  loading: boolean;
  saving: boolean;
}

const initialState: State = {
  items: [],
  loading: false,
  saving: false,
};

export const fetchRules = createAsyncThunk(
  'vocab/fetch',
  () => httpService.get<VocabRule[]>('/api/admin/vocab-rules', {
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
      state.items = action.payload ?? [];
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
