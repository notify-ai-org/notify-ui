import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getPaginated, httpService, type PaginatedResponse } from '@notify-ui/shared';
import type { ManagedConfiguration } from '../../types';
import type { Reducer } from '@reduxjs/toolkit';

interface State {
  items: ManagedConfiguration[];
  loading: boolean;
  page: number;
  totalPages: number;
  savingKey: string | null;
}

export const fetchManagedConfigurations = createAsyncThunk<PaginatedResponse<ManagedConfiguration>, number | void>(
  'settings/fetchManagedConfigurations',
  (page) => getPaginated<ManagedConfiguration>('/api/admin/config/managed', {
    page: page ?? 0,
    cacheKey: 'config:managed',
    ttlMs: 30_000,
  }),
);

export const saveManagedConfiguration = createAsyncThunk(
  'settings/saveManagedConfiguration',
  ({ key, value }: { key: string; value: string }) =>
    httpService.put<ManagedConfiguration>(`/api/admin/config/managed/${encodeURIComponent(key)}`, {
      data: { value },
      invalidateKey: 'config:managed',
      successModal: {
        title: 'Configuration updated',
        message: `${key} has been applied.`,
        variant: 'success',
        autoCloseMs: 2_000,
      },
    }),
);

const slice = createSlice({
  name: 'settings',
  initialState: { items: [], loading: false, page: 0, totalPages: 1, savingKey: null } as State,
  reducers: {
    updateValue(state, action: PayloadAction<{ key: string; value: string }>) {
      const entry = state.items.find(item => item.key === action.payload.key);
      if (entry) entry.value = action.payload.value;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchManagedConfigurations.pending, state => { state.loading = true; });
    builder.addCase(fetchManagedConfigurations.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.content;
      state.page = action.payload.number;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(fetchManagedConfigurations.rejected, state => { state.loading = false; });
    builder.addCase(saveManagedConfiguration.pending, (state, action) => { state.savingKey = action.meta.arg.key; });
    builder.addCase(saveManagedConfiguration.fulfilled, (state, action) => {
      state.savingKey = null;
      const index = state.items.findIndex(item => item.key === action.payload?.data.key);
      if (index !== -1 && action.payload?.data) state.items[index] = action.payload.data;
    });
    builder.addCase(saveManagedConfiguration.rejected, state => { state.savingKey = null; });
  },
});

export const { updateValue } = slice.actions;
export const reducers = { settings: slice.reducer as Reducer<unknown> };
