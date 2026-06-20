import {
  createSharedStore,
  initApiConfig,
  registerErrorHandlerStore,
  registerHttpServiceStore,
} from '@notify-ui/shared';

initApiConfig({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '',
  getAccessToken: () => {
    const match = document.cookie.match(/notify_access_token=([^;]+)/);
    return match ? match[1] : null;
  },
  enableRequestLogging: import.meta.env.DEV,
});

export const store = createSharedStore();

registerHttpServiceStore(store);
registerErrorHandlerStore(store);
