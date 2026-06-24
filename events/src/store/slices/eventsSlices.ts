/** Events portal Redux slices */
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type {
  RegisteredEvent, ScheduledEvent, CaptureLogEntry,
  NotificationLogEntry, EventMetrics, ScheduleConfig,
} from '../../types';
import { httpService } from '@notify-ui/shared';

// ─── Registered events ───────────────────────────────────────────────────────

interface RegisteredEventsState {
  items: RegisteredEvent[];
  loading: boolean;
  error: string | null;
}

export const fetchRegisteredEvents = createAsyncThunk(
  'registeredEvents/fetch',
  () => httpService.get<{ content: RegisteredEvent[] }>('/api/admin/data/events', {
    cacheKey: 'events:registered',
    ttlMs: 60_000,
  }).then(page => page.content ?? []),
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
  initialState: { items: [], loading: false, error: null } as RegisteredEventsState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchRegisteredEvents.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchRegisteredEvents.fulfilled, (s, a) => { s.loading = false; s.items = a.payload ?? []; });
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
}

export const fetchScheduledEvents = createAsyncThunk(
  'scheduledEvents/fetch',
  () => httpService.get<ScheduledEvent[]>('/api/admin/events/scheduled', {
    cacheKey: 'events:scheduled',
    ttlMs: 30_000,
  }),
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
  initialState: { items: [], loading: false, saving: false, error: null } as ScheduledEventsState,
  reducers: {
    optimisticToggle(state, action: PayloadAction<{ id: string; status: 'PAUSED' | 'RUNNING' }>) {
      const item = state.items.find(e => e.id === action.payload.id);
      if (item) item.status = action.payload.status;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchScheduledEvents.pending, (s) => { s.loading = true; });
    b.addCase(fetchScheduledEvents.fulfilled, (s, a) => { s.loading = false; s.items = a.payload ?? []; });
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
  (page: number) => httpService.get<{ content: CaptureLogEntry[]; totalPages: number }>(
    '/api/admin/events/logs/capture',
    { params: { page, size: 20 }, ttlMs: 15_000 },
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
      if (a.payload) { s.entries = a.payload.content; s.totalPages = a.payload.totalPages; }
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
  (page: number) => httpService.get<{ content: NotificationLogEntry[]; totalPages: number }>(
    '/api/admin/events/logs/notifications',
    { params: { page, size: 20 }, ttlMs: 15_000 },
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
      if (a.payload) { s.entries = a.payload.content; s.totalPages = a.payload.totalPages; }
    });
    b.addCase(fetchNotificationLog.rejected, (s) => { s.loading = false; });
  },
});
export const { setPage: setNotifLogPage } = notificationLogSlice.actions;

// ─── Metrics ─────────────────────────────────────────────────────────────────

interface MetricsState {
  data: EventMetrics | null;
  loading: boolean;
}

export const fetchMetrics = createAsyncThunk(
  'metrics/fetch',
  () => httpService.get<EventMetrics>('/api/admin/events/metrics', {
    cacheKey: 'events:metrics',
    ttlMs: 60_000,
  }),
);

const metricsSlice = createSlice({
  name: 'metrics',
  initialState: { data: null, loading: false } as MetricsState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMetrics.pending, (s) => { s.loading = true; });
    b.addCase(fetchMetrics.fulfilled, (s, a) => { s.loading = false; s.data = a.payload ?? null; });
    b.addCase(fetchMetrics.rejected, (s) => { s.loading = false; });
  },
});

export const reducers = {
  registeredEvents: registeredEventsSlice.reducer,
  scheduledEvents: scheduledEventsSlice.reducer,
  captureLog: captureLogSlice.reducer,
  notificationLog: notificationLogSlice.reducer,
  metrics: metricsSlice.reducer,
};
