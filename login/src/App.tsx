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
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin    { to   { transform: rotate(360deg) } }
        @keyframes shake   { 0%,100% { transform: translateX(0) } 20%,60% { transform: translateX(-4px) } 40%,80% { transform: translateX(4px) } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse-ring { 0% { transform: scale(0.95); opacity: 0.6 } 100% { transform: scale(1.8); opacity: 0 } }
        @keyframes blink   { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
      `}</style>
      <BrowserRouter basename={BASE}>
        <Routes>
          <Route path="/"          element={<LoginPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />
          {/* Catch-all: unknown routes → back to login */}
          <Route path="*"          element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
