import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ModalProvider } from '@notify-ui/shared';
import { store } from './store';
import { EventsDashboard } from './pages/EventsDashboard';
import './styles/global.css';

const configuredBase = import.meta.env.VITE_PORTAL_BASE;
const defaultBase =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/portals/events')
    ? '/portals/events/'
    : '/';
const base =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? undefined
    : configuredBase ?? defaultBase;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <BrowserRouter basename={base}>
          <EventsDashboard />
        </BrowserRouter>
      </ModalProvider>
    </Provider>
  </React.StrictMode>,
);
