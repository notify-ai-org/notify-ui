/** Events portal Redux slices */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RegisteredEvent, ScheduledEvent, CaptureLogEntry,
  NotificationLogEntry, ScheduleConfig,
} from '../../types';
import { getPaginated, httpService, type PaginatedResponse } from '@notify-ui/shared';

// ─── Registered events ───────────────────────────────────────────────────────

interface RegisteredEventsState {
  items: RegisteredEvent[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
}

export const fetchRegisteredEvents = createAsyncThunk<PaginatedResponse<RegisteredEvent>, number | void>(
  'registeredEvents/fetch',
  (page) => getPaginated<RegisteredEvent>('/api/admin/data/events', {
    page: page ?? 0,
    cacheKey: 'events:registered',
    ttlMs: 60_000,
  }),
);

export const updateRegisteredEvent = createAsyncThunk(
  'registeredEvents/update',
  ({ id, event }: { id: string; event: Partial<RegisteredEvent> }) =>
    httpService.put<RegisteredEvent>(`/api/admin/data/events/${id}`, {
      data: event, invalidateKey: 'events:registered', successModal: null,
    }).then(response => response.data),
);

export const deleteRegisteredEvent = createAsyncThunk(
  'registeredEvents/delete',
  (id: string) => httpService.delete(`/api/admin/data/events/${id}`, {
    invalidateKey: 'events:registered', successModal: null,
  }).then(() => id),
);

const registeredEventsSlice = createSlice({
  name: 'registeredEvents',
  initialState: { items: [], loading: false, error: null, page: 0, totalPages: 1 } as RegisteredEventsState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchRegisteredEvents.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchRegisteredEvents.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload.content;
      s.page = a.payload.number;
      s.totalPages = a.payload.totalPages;
    });
    b.addCase(fetchRegisteredEvents.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed'; });
    b.addCase(updateRegisteredEvent.fulfilled, (s, a) => {
      const index = s.items.findIndex(item => item.id === a.payload?.id);
      if (index >= 0 && a.payload) s.items[index] = a.payload;
    });
    b.addCase(deleteRegisteredEvent.fulfilled, (s, a) => { s.items = s.items.filter(item => item.id !== a.payload); });
  },
});

// ─── Scheduled events ────────────────────────────────────────────────────────

interface ScheduledEventsState {
  items: ScheduledEvent[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  page: number;
  totalPages: number;
}

export const fetchScheduledEvents = createAsyncThunk<PaginatedResponse<ScheduledEvent>, { forceRefresh?: boolean; page?: number } | void>(
  'scheduledEvents/fetch',
  (options) => {
    const forceRefresh = options?.forceRefresh ?? false;
    const from = new Date();
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
    return getPaginated<ScheduledEvent>('/api/admin/data/scheduled-events', {
      page: options?.page,
      cacheKey: 'events:scheduled',
      ttlMs: 30_000,
      forceRefresh,
      params: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
    });
  },
);

export const updateSchedule = createAsyncThunk(
  'scheduledEvents/update',
  ({ id, schedule }: { id: string; schedule: ScheduleConfig }) =>
    httpService.put<ScheduledEvent>(`/api/admin/events/scheduled/${id}/schedule`, {
      data: schedule,
      invalidateKey: 'events:scheduled',
      successModal: {
        title: 'Schedule updated',
        message: 'The schedule has been saved successfully.',
        variant: 'success',
        autoCloseMs: 2500,
      },
    }),
);

export const toggleScheduleStatus = createAsyncThunk(
  'scheduledEvents/toggle',
  ({ id, pause }: { id: string; pause: boolean }) =>
    httpService.patch<ScheduledEvent>(`/api/admin/events/scheduled/${id}/${pause ? 'pause' : 'resume'}`, {
      invalidateKey: 'events:scheduled',
    }),
);

const scheduledEventsSlice = createSlice({
  name: 'scheduledEvents',
  initialState: { items: [], loading: false, saving: false, error: null, page: 0, totalPages: 1 } as ScheduledEventsState,
  reducers: {
    optimisticToggle(state, action: PayloadAction<{ id: string; status: 'PAUSED' | 'RUNNING' }>) {
      const item = state.items.find(e => e.id === action.payload.id);
      if (item) item.status = action.payload.status;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchScheduledEvents.pending, (s) => { s.loading = true; });
    b.addCase(fetchScheduledEvents.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload.content;
      s.page = a.payload.number;
      s.totalPages = a.payload.totalPages;
    });
    b.addCase(fetchScheduledEvents.rejected, (s, a) => { s.loading = false; s.error = a.error.message ?? 'Failed'; });
    b.addCase(updateSchedule.pending, (s) => { s.saving = true; });
    b.addCase(updateSchedule.fulfilled, (s, a) => {
      s.saving = false;
      if (a.payload?.data) {
        const idx = s.items.findIndex(e => e.id === a.payload!.data.id);
        if (idx !== -1) s.items[idx] = a.payload.data;
      }
    });
    b.addCase(updateSchedule.rejected, (s) => { s.saving = false; });
  },
});
export const { optimisticToggle } = scheduledEventsSlice.actions;

// ─── Capture log ─────────────────────────────────────────────────────────────

interface CaptureLogState {
  entries: CaptureLogEntry[];
  loading: boolean;
  page: number;
  totalPages: number;
}

export const fetchCaptureLog = createAsyncThunk(
  'captureLog/fetch',
  (page: number) => getPaginated<CaptureLogEntry>(
    '/api/admin/events/logs/capture',
    { page, ttlMs: 15_000 },
  ),
);

const captureLogSlice = createSlice({
  name: 'captureLog',
  initialState: { entries: [], loading: false, page: 0, totalPages: 1 } as CaptureLogState,
  reducers: {
    setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; },
  },
  extraReducers: (b) => {
    b.addCase(fetchCaptureLog.pending, (s) => { s.loading = true; });
    b.addCase(fetchCaptureLog.fulfilled, (s, a) => {
      s.loading = false;
      if (a.payload) {
        s.entries = a.payload.content;
        s.page = a.payload.number;
        s.totalPages = a.payload.totalPages;
      }
    });
    b.addCase(fetchCaptureLog.rejected, (s) => { s.loading = false; });
  },
});
export const { setPage: setCaptureLogPage } = captureLogSlice.actions;

// ─── Notification log ────────────────────────────────────────────────────────

interface NotificationLogState {
  entries: NotificationLogEntry[];
  loading: boolean;
  page: number;
  totalPages: number;
}

export const fetchNotificationLog = createAsyncThunk(
  'notificationLog/fetch',
  (page: number) => getPaginated<NotificationLogEntry>(
    '/api/admin/events/logs/notifications',
    { page, ttlMs: 15_000 },
  ),
);

const notificationLogSlice = createSlice({
  name: 'notificationLog',
  initialState: { entries: [], loading: false, page: 0, totalPages: 1 } as NotificationLogState,
  reducers: {
    setPage: (s, a: PayloadAction<number>) => { s.page = a.payload; },
  },
  extraReducers: (b) => {
    b.addCase(fetchNotificationLog.pending, (s) => { s.loading = true; });
    b.addCase(fetchNotificationLog.fulfilled, (s, a) => {
      s.loading = false;
      if (a.payload) {
        s.entries = a.payload.content;
        s.page = a.payload.number;
        s.totalPages = a.payload.totalPages;
      }
    });
    b.addCase(fetchNotificationLog.rejected, (s) => { s.loading = false; });
  },
});
export const { setPage: setNotifLogPage } = notificationLogSlice.actions;

export const reducers = {
  registeredEvents: registeredEventsSlice.reducer,
  scheduledEvents: scheduledEventsSlice.reducer,
  captureLog: captureLogSlice.reducer,
  notificationLog: notificationLogSlice.reducer,
};
