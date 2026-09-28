import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Reducer } from '@reduxjs/toolkit';
import { getPaginated, httpService } from '@notify-ui/shared';
import type { DeadLetterEntry } from '../../types';

interface State {
  items: DeadLetterEntry[];
  loading: boolean;
  page: number;
  totalPages: number;
  retrying: number[];
}

const initialState: State = {
  items: [],
  loading: false,
  page: 0,
  totalPages: 1,
  retrying: [],
};

export const fetchDLQ = createAsyncThunk(
  'dlq/fetch',
  ({ page, status }: { page: number; status: string }) => getPaginated<DeadLetterEntry>('/api/admin/dead-letter', {
    page,
    params: { status: status || undefined },
  }),
);

/** Re-reads the current page without the loading skeleton, used while replays are in flight. */
export const refreshDLQ = createAsyncThunk(
  'dlq/refresh',
  ({ page, status }: { page: number; status: string }) => getPaginated<DeadLetterEntry>('/api/admin/dead-letter', {
    page,
    params: { status: status || undefined },
    ttlMs: 0,
  }),
);

export const retryEntry = createAsyncThunk(
  'dlq/retry',
  (id: number) => httpService.post<Record<string, unknown>>(`/api/admin/dead-letter/${id}/replay`, {
    invalidateKey: 'dlq:list',
    successModal: {
      title: 'Replay queued',
      message: 'The entry is replaying in the background.',
      variant: 'success',
      autoCloseMs: 2000,
    },
  }),
);

export const discardEntry = createAsyncThunk(
  'dlq/discard',
  (id: number) => httpService.post<Record<string, unknown>>(`/api/admin/dead-letter/${id}/discard`, {
    invalidateKey: 'dlq:list',
  }),
);

const slice = createSlice({
  name: 'dlq',
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchDLQ.pending, state => {
      state.loading = true;
    });
    builder.addCase(fetchDLQ.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.items = action.payload.content;
        state.page = action.payload.number;
        state.totalPages = action.payload.totalPages;
      }
    });
    builder.addCase(fetchDLQ.rejected, state => {
      state.loading = false;
    });
    builder.addCase(retryEntry.pending, (state, action) => {
      state.retrying.push(action.meta.arg);
    });
    builder.addCase(retryEntry.fulfilled, (state, action) => {
      state.retrying = state.retrying.filter(id => id !== action.meta.arg);
      // The DLQ replay thread dispatches the job; refreshes report REPLAYED or a replay error.
      updateReplayStatus(state, action.meta.arg, 'REPLAYING');
    });
    builder.addCase(refreshDLQ.fulfilled, (state, action) => {
      state.items = action.payload.content;
      state.totalPages = action.payload.totalPages;
    });
    builder.addCase(retryEntry.rejected, (state, action) => {
      state.retrying = state.retrying.filter(id => id !== action.meta.arg);
    });
    builder.addCase(discardEntry.fulfilled, (state, action) => {
      updateReplayStatus(state, action.meta.arg, 'DISCARDED');
    });
  },
});

function updateReplayStatus(state: State, id: number, replayStatus: DeadLetterEntry['replayStatus']) {
  const entry = state.items.find(item => item.id === id);
  if (entry) {
    entry.replayStatus = replayStatus;
    if (replayStatus === 'REPLAYING') entry.replayError = null;
  }
}

export const { setPage: setDLQPage } = slice.actions;
export const reducers = { dlq: slice.reducer as Reducer<unknown> };
