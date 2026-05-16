import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ModalProvider } from '@notify-ui/shared';
import { store } from './store';
import { EventsDashboard } from './pages/EventsDashboard';
import './styles/global.css';

const base = import.meta.env.VITE_PORTAL_BASE ?? '/portals/events/';

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
