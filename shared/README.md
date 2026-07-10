<p align="center">
  <img src="../assets/notify-ai-logo.svg" alt="Notify.ai" width="96" />
</p>

<h1 align="center">@notify-ui/shared</h1>

Shared React library for Notify-UI microfrontends.

## What's included

| Area | Exports |
|---|---|
| API config | `initApiConfig`, `getApiConfig` |
| HTTP service | `httpService` (get/post/put/patch/delete), `registerHttpServiceStore` |
| Interceptors | Axios singleton with auth injection, request logging, error normalisation |
| Redux store | `createSharedStore`, cache slice, modal slice |
| Error handling | `registerErrorHandlerStore`, `handleApiError` |
| Hooks | `useHttp`, `useModal`, `useLogger` |
| Logger | `logger`, `setLogLevel`, `setLogTransport` |
| Modal UI | `ModalProvider`, `NotifyModal` |
| Types | All shared TypeScript types |

---

## Quick start for a new microfrontend

### 1. Install

```bash
npm install @notify-ui/shared react react-dom react-redux @reduxjs/toolkit
```

### 2. Create the store

```ts
// src/store/index.ts
import { createSharedStore } from '@notify-ui/shared';
import eventsReducer from './eventsSlice';

export const store = createSharedStore({ events: eventsReducer });
export type RootState = ReturnType<typeof store.getState>;
```

### 3. Bootstrap the library

```ts
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import {
  initApiConfig,
  registerHttpServiceStore,
  registerErrorHandlerStore,
  ModalProvider,
} from '@notify-ui/shared';
import { store } from './store';
import App from './App';

// Configure the API (call before any HTTP request)
initApiConfig({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  getAccessToken: () => localStorage.getItem('access_token'),
});

// Wire the store into the shared services
registerHttpServiceStore(store);
registerErrorHandlerStore(store);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ModalProvider>   {/* ← renders the shared error/success modal */}
        <App />
      </ModalProvider>
    </Provider>
  </React.StrictMode>,
);
```

### 4. Use in a component

```tsx
// src/features/EventsDashboard.tsx
import { useEffect } from 'react';
import { useHttp, useLogger, httpService } from '@notify-ui/shared';

export function EventsDashboard() {
  const log = useLogger('EventsDashboard');
  const { data, loading, error, execute } = useHttp<Event[]>();

  useEffect(() => {
    execute(() =>
      httpService.get('/events', {
        cacheKey: 'events:all',
        ttlMs: 60_000, // 1 minute cache
      }),
    );
  }, [execute]);

  if (loading) return <p>Loading…</p>;
  if (error) return null; // Error modal is shown automatically

  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
```

### 5. Mutation with optimistic update + rollback

```ts
// In a Redux actions file (per module)
import { httpService, showModal, setEntry } from '@notify-ui/shared';
import { store } from '../store';

export async function deleteEvent(eventId: string) {
  await httpService.delete(`/events/${eventId}`, {
    invalidateKey: 'events:all',

    // Optimistically remove from cache before the server responds
    optimisticUpdate: (store) => {
      const current = store.getState().cache.entries['events:all'];
      if (current) {
        const filtered = (current.data as Event[]).filter(e => e.id !== eventId);
        store.dispatch(setEntry({ key: 'events:all', data: filtered, ttlMs: 60_000 }));
      }
    },

    // If the server returns 2xx, show a success toast
    successModal: {
      title: 'Event deleted',
      message: 'The event was successfully removed.',
      variant: 'success',
      autoCloseMs: 3000,
    },
  });
  // If the server fails, the cache entry is automatically restored
  // and an error modal is shown — no extra code needed.
}
```

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Microfrontend                                              │
│  ┌──────────┐   dispatch    ┌───────────────────────────┐   │
│  │ Component│ ─────────────▶│ Module actions file        │   │
│  └──────────┘               │  (per microfrontend)       │   │
│        │                    │  calls httpService.*        │   │
│        │ useHttp             └───────────┬───────────────┘   │
│        │                                │                    │
│  ┌─────▼──────────────────────────────▼──────────────────┐  │
│  │              @notify-ui/shared                         │  │
│  │                                                        │  │
│  │  httpService                                           │  │
│  │    ├─ GET  → check cacheSlice → Axios → store entry   │  │
│  │    └─ MUT  → snapshot → optimisticUpdate → Axios      │  │
│  │               ├─ ✓ → invalidate cache + successModal  │  │
│  │               └─ ✗ → errorHandler → rollback + modal  │  │
│  │                                                        │  │
│  │  Redux store (createSharedStore)                       │  │
│  │    ├─ cacheSlice  (entries + rollbacks)                │  │
│  │    └─ modalSlice  (isOpen + config)                    │  │
│  │                                                        │  │
│  │  Hooks: useHttp · useModal · useLogger                 │  │
│  │  ModalProvider (renders <NotifyModal /> from Redux)    │  │
│  │  logger (structured, pluggable transport)              │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Module list (to be implemented)

| Module | Route |
|---|---|
| Login / SignUp | `/login` |
| 403 Forbidden | `/403` |
| Events Dashboard | `/events` |
| Templates | `/templates` |
| Memory & Facts | `/memory` |
| Domain Content | `/domain` |
| Vocabulary & Rules | `/vocab-rules` |
| Config & Settings | `/settings` |
| Dead Letter Management | `/dead-letters` |
