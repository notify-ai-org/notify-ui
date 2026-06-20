import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { ModalProvider } from '@notify-ui/shared';
import App from './App';
import { store } from './store';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <App />
      </ModalProvider>
    </Provider>
  </React.StrictMode>,
);
