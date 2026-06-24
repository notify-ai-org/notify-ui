/**
 * App.tsx — router shell for the login portal.
 *
 * Routes:
 *   /          → LoginPage  (sign-in screen)
 *   /forbidden → ForbiddenPage  (403 access-denied screen)
 *
 * GoogleOAuthProvider wraps both routes so the Google SDK is only loaded once.
 */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginPage from './LoginPage';
import ForbiddenPage from './ForbiddenPage';

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID';

const configuredBase = (import.meta as any).env?.VITE_PORTAL_BASE;
const defaultBase =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/portals/login')
    ? '/portals/login/'
    : '/';
const BASE =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? undefined
    : configuredBase ?? defaultBase;

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <style>{`
        html, body, #root { width: 100%; min-height: 100%; margin: 0; background: #090909; }
        body { overflow: hidden; }
      `}</style>
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
