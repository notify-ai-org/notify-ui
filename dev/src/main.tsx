import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/shell.css';

// Import portal CSS so each portal renders correctly when lazy-loaded
// Admin portals — use the same global.css
import '../../events/src/styles/global.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
