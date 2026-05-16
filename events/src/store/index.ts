import { createSharedStore, registerHttpServiceStore, registerErrorHandlerStore, initApiConfig } from '@notify-ui/shared';
import type { Reducer } from '@reduxjs/toolkit';
import { reducers } from './slices/eventsSlices';

// Bootstrap API config — reads base URL from Vite env
initApiConfig({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  getAccessToken: () => {
    // Read the cookie set by the login portal
    const match = document.cookie.match(/notify_access_token=([^;]+)/);
    return match ? match[1] : null;
  },
  enableRequestLogging: import.meta.env.DEV,
});

// createSharedStore expects Record<string, Reducer<unknown>>
// Cast the reducers map to satisfy the constraint while preserving our types
export const store = createSharedStore(
  reducers as unknown as Record<string, Reducer<unknown>>,
);

// Wire store into shared services
registerHttpServiceStore(store);
registerErrorHandlerStore(store);

export type RootState = {
  cache: ReturnType<typeof store.getState>['cache'];
  modal: ReturnType<typeof store.getState>['modal'];
} & {
  [K in keyof typeof reducers]: ReturnType<(typeof reducers)[K]>;
};

export type AppDispatch = typeof store.dispatch;
