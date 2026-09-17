import { createSlice, nanoid, type PayloadAction, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit';
import { request, channelPath, errorMessage, ApiError, type Channel, type Metrics, type SecretMetadata } from '../api';

export type ChannelsState = {
  channels: Channel[]; selectedId: string; tenant: string;
  loading: boolean; busy: boolean; error: string; notice: string;
  metadata: SecretMetadata | null; metrics: Metrics | null;
  detailsLoading: boolean; detailsError: string; days: number; revision: number;
  listRequestId: string; detailsRequestId: string;
};
const initialState: ChannelsState = {
  channels: [], selectedId: '', tenant: 'Current tenant', loading: true, busy: false,
  error: '', notice: '', metadata: null, metrics: null, detailsLoading: false,
  detailsError: '', days: 7, revision: 0, listRequestId: '', detailsRequestId: '',
};
const clearDetails = (state: ChannelsState) => {
  state.metadata = null; state.metrics = null; state.detailsError = '';
  state.detailsRequestId = ''; state.detailsLoading = !!state.selectedId;
};
const slice = createSlice({
  name: 'channels', initialState,
  reducers: {
    selectChannel(state, { payload }: PayloadAction<string>) {
      if (state.selectedId === payload) return;
      state.selectedId = payload; state.notice = ''; clearDetails(state);
    },
    setDays(state, { payload }: PayloadAction<number>) {
      if (state.days === payload) return;
      state.days = payload; clearDetails(state);
    },
    clearError(state) { state.error = ''; },
    clearNotice(state) { state.notice = ''; },
    tenantLoaded(state, { payload }: PayloadAction<string>) { state.tenant = payload; },
    listStarted(state, { payload }: PayloadAction<string>) { state.listRequestId = payload; state.loading = true; state.error = ''; },
    listLoaded(state, { payload }: PayloadAction<{ requestId: string; channels: Channel[] }>) {
      if (state.listRequestId !== payload.requestId) return;
      state.channels = payload.channels; state.loading = false;
      if (!payload.channels.some(c => c.id === state.selectedId)) {
        state.selectedId = payload.channels[0]?.id ?? ''; clearDetails(state);
      }
    },
    listFailed(state, { payload }: PayloadAction<{ requestId: string; message: string }>) {
      if (state.listRequestId !== payload.requestId) return;
      state.loading = false; state.error = payload.message;
    },
    detailsStarted(state, { payload }: PayloadAction<string>) {
      clearDetails(state); state.detailsRequestId = payload; state.detailsLoading = true;
    },
    detailsLoaded(state, { payload }: PayloadAction<{ requestId: string; metadata: SecretMetadata; metrics: Metrics }>) {
      if (state.detailsRequestId !== payload.requestId) return;
      state.metadata = payload.metadata; state.metrics = payload.metrics; state.detailsLoading = false;
    },
    detailsFailed(state, { payload }: PayloadAction<{ requestId: string; message: string }>) {
      if (state.detailsRequestId !== payload.requestId) return;
      state.detailsLoading = false; state.detailsError = payload.message;
    },
    mutationStarted(state) { state.busy = true; state.error = ''; state.notice = ''; },
    mutationSucceeded(state, { payload }: PayloadAction<string>) {
      state.notice = payload; state.revision += 1; clearDetails(state);
    },
    mutationFailed(state, { payload }: PayloadAction<string>) { state.error = payload; },
    mutationFinished(state) { state.busy = false; },
  },
});
export const channelsActions = slice.actions;
export default slice.reducer;
export type ChannelsRootState = { channels: ChannelsState };
export type ChannelThunk<T = void> = ThunkAction<T, ChannelsRootState, unknown, UnknownAction>;
const a = slice.actions;

export const loadTenant = (signal?: AbortSignal): ChannelThunk<Promise<void>> => async dispatch => {
  try {
    const profile = await request<{ tenantId: string }>('/api/admin/auth/profile', 'GET', undefined, signal);
    if (!signal?.aborted) dispatch(a.tenantLoaded(profile.tenantId));
  } catch { /* The channel request presents authentication errors. */ }
};
export const loadChannels = (signal?: AbortSignal): ChannelThunk<Promise<void>> => async dispatch => {
  const requestId = nanoid(); dispatch(a.listStarted(requestId));
  try {
    const channels = await request<Channel[]>('/api/v1/channels', 'GET', undefined, signal);
    if (!signal?.aborted) dispatch(a.listLoaded({ requestId, channels }));
  } catch (error) {
    if (!signal?.aborted) dispatch(a.listFailed({ requestId, message: errorMessage(error) }));
  }
};
export const loadDetails = (signal?: AbortSignal): ChannelThunk<Promise<void>> => async (dispatch, getState) => {
  const { selectedId, days } = getState().channels;
  if (!selectedId) return;
  const requestId = nanoid(); dispatch(a.detailsStarted(requestId));
  try {
    const [metadata, metrics] = await Promise.all([
      request<SecretMetadata>(`${channelPath(selectedId)}/credentials/metadata`, 'GET', undefined, signal),
      request<Metrics>(`${channelPath(selectedId)}/metrics?days=${days}`, 'GET', undefined, signal),
    ]);
    if (!signal?.aborted) dispatch(a.detailsLoaded({ requestId, metadata, metrics }));
  } catch (error) {
    if (!signal?.aborted) dispatch(a.detailsFailed({ requestId, message: errorMessage(error) }));
  }
};

type Mutation =
  | { kind: 'create'; body: unknown }
  | { kind: 'settings'; id: string; body: unknown }
  | { kind: 'activation'; id: string; enabled: boolean }
  | { kind: 'credentials'; id: string; replace: boolean; credentials: Record<string, string> }
  | { kind: 'rotate' | 'revoke'; id: string };

// A closure thunk deliberately avoids createAsyncThunk's meta.arg: credential
// values must never become Redux actions, state, or DevTools history.
export const mutateChannel = (command: Mutation, success: string): ChannelThunk<Promise<boolean>> => async (dispatch, getState) => {
  if (getState().channels.busy) return false;
  dispatch(a.mutationStarted());
  try {
    switch (command.kind) {
      case 'create': {
        const created = await request<Channel>('/api/v1/channels', 'POST', command.body);
        dispatch(a.selectChannel(created.id)); break;
      }
      case 'settings': await request(channelPath(command.id), 'PUT', command.body); break;
      case 'activation': await request(`${channelPath(command.id)}/activation`, 'PATCH', { enabled: command.enabled }); break;
      case 'credentials': await request(`${channelPath(command.id)}/credentials`, command.replace ? 'PUT' : 'POST', { credentials: command.credentials }); break;
      case 'rotate': await request(`${channelPath(command.id)}/credentials/rotate`, 'POST'); break;
      case 'revoke': await request(`${channelPath(command.id)}/credentials`, 'DELETE'); break;
    }
    dispatch(a.mutationSucceeded(success));
    await dispatch(loadChannels());
    return true;
  } catch (error) {
    if (command.kind === 'create' && error instanceof ApiError && error.status === 409) await dispatch(loadChannels());
    dispatch(a.mutationFailed(errorMessage(error))); return false;
  } finally { dispatch(a.mutationFinished()); }
};
