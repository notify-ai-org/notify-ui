import { createSharedStore, initApiConfig, registerErrorHandlerStore, registerHttpServiceStore } from '@notify-ui/shared';
import type { Reducer, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import channelsReducer, { type ChannelsRootState } from './channelsSlice';

initApiConfig({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  getAccessToken: () => document.cookie.match(/(?:^|;\s*)notify_access_token=([^;]+)/)?.[1] ?? null,
  enableRequestLogging: import.meta.env.DEV,
});
export const store = createSharedStore({ channels: channelsReducer as Reducer<unknown> });
registerHttpServiceStore(store);
registerErrorHandlerStore(store);
export type AppDispatch = ThunkDispatch<ChannelsRootState, unknown, UnknownAction>;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<ChannelsRootState> = useSelector;
