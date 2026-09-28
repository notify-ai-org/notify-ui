import { createSlice, nanoid, type PayloadAction, type ThunkAction, type UnknownAction } from '@reduxjs/toolkit';
import { deletePreference, errorMessage, listPreferences, savePreference, type Preference, type PreferenceInput } from '../api';

export type PreferencesState = {
  records: Preference[]; selected: Preference | null; query: string; page: number; totalPages: number; totalElements: number;
  loading: boolean; busy: boolean; error: string; notice: string; revision: number; listRequestId: string;
};
const initialState: PreferencesState = {
  records: [], selected: null, query: '', page: 0, totalPages: 0, totalElements: 0,
  loading: true, busy: false, error: '', notice: '', revision: 0, listRequestId: '',
};
const slice = createSlice({
  name: 'preferences', initialState,
  reducers: {
    select(state, { payload }: PayloadAction<Preference | null>) { state.selected = payload; state.notice = ''; },
    setQuery(state, { payload }: PayloadAction<string>) { state.query = payload; state.page = 0; },
    setPage(state, { payload }: PayloadAction<number>) { state.page = payload; },
    clearError(state) { state.error = ''; },
    clearNotice(state) { state.notice = ''; },
    listStarted(state, { payload }: PayloadAction<string>) { state.listRequestId = payload; state.loading = true; state.error = ''; },
    listLoaded(state, { payload }: PayloadAction<{ requestId: string; records: Preference[]; totalPages: number; totalElements: number }>) {
      if (state.listRequestId !== payload.requestId) return;
      state.records = payload.records; state.totalPages = payload.totalPages;
      state.totalElements = payload.totalElements; state.loading = false;
      // The open recipient stays selected even when it is not on the current page.
      if (!state.selected) state.selected = payload.records[0] ?? null;
    },
    listFailed(state, { payload }: PayloadAction<{ requestId: string; message: string }>) {
      if (state.listRequestId !== payload.requestId) return;
      state.loading = false; state.error = payload.message;
    },
    mutationStarted(state) { state.busy = true; state.error = ''; state.notice = ''; },
    saved(state, { payload }: PayloadAction<{ record: Preference; notice: string }>) {
      const index = state.records.findIndex(r => r.subjectId === payload.record.subjectId);
      if (index >= 0) state.records[index] = payload.record;
      state.selected = payload.record; state.notice = payload.notice; state.revision += 1;
    },
    removed(state, { payload }: PayloadAction<string>) {
      state.records = state.records.filter(r => r.subjectId !== payload);
      if (state.selected?.subjectId === payload) state.selected = state.records[0] ?? null;
      state.notice = 'Preferences removed. This recipient now follows your channel policy.'; state.revision += 1;
    },
    mutationFailed(state, { payload }: PayloadAction<string>) { state.error = payload; },
    mutationFinished(state) { state.busy = false; },
  },
});
export const preferencesActions = slice.actions;
export default slice.reducer;
export type PreferencesRootState = { preferences: PreferencesState };
export type PreferencesThunk<T = void> = ThunkAction<T, PreferencesRootState, unknown, UnknownAction>;
const a = slice.actions;

export const loadPreferences = (signal?: AbortSignal): PreferencesThunk<Promise<void>> => async (dispatch, getState) => {
  const { query, page } = getState().preferences;
  const requestId = nanoid(); dispatch(a.listStarted(requestId));
  try {
    const result = await listPreferences(query, page, signal);
    if (!signal?.aborted) dispatch(a.listLoaded({ requestId, records: result.content,
      totalPages: result.totalPages, totalElements: result.totalElements }));
  } catch (error) {
    if (!signal?.aborted) dispatch(a.listFailed({ requestId, message: errorMessage(error) }));
  }
};

type Mutation = { kind: 'save'; subjectId: string; body: PreferenceInput; created: boolean } | { kind: 'delete'; subjectId: string };

export const mutatePreference = (command: Mutation): PreferencesThunk<Promise<boolean>> => async (dispatch, getState) => {
  if (getState().preferences.busy) return false;
  dispatch(a.mutationStarted());
  try {
    if (command.kind === 'save') {
      const record = await savePreference(command.subjectId, command.body);
      dispatch(a.saved({ record, notice: command.created ? 'Recipient added.' : 'Preferences saved.' }));
      // A new recipient may belong on another page; reload so the list reflects the server order.
      if (command.created) await dispatch(loadPreferences());
    } else {
      await deletePreference(command.subjectId);
      dispatch(a.removed(command.subjectId));
    }
    return true;
  } catch (error) {
    dispatch(a.mutationFailed(errorMessage(error))); return false;
  } finally { dispatch(a.mutationFinished()); }
};
