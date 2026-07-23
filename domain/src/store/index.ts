import {
  createSharedStore,
  initApiConfig,
  registerErrorHandlerStore,
  registerHttpServiceStore,
} from '@notify-ui/shared';
import type { Reducer } from '@reduxjs/toolkit';
import { reducers } from './slices/domainSlice';

initApiConfig({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  getAccessToken: () => document.cookie.match(/notify_access_token=([^;]+)/)?.[1] ?? null,
  enableRequestLogging: import.meta.env.DEV,
});

export const store = createSharedStore(reducers as Record<string, Reducer<unknown>>);
registerHttpServiceStore(store);
registerErrorHandlerStore(store);

export type RootState = { cache: any; modal: any } & { [K in keyof typeof reducers]: ReturnType<(typeof reducers)[K]> };
export type AppDispatch = typeof store.dispatch;
