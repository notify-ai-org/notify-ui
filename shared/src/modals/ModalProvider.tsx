/**
 * Modal components
 *
 * Two presentational components:
 *   <NotifyModal />  — the base modal rendered by <ModalProvider />
 *   <ModalProvider /> — mounts once at the root; reads from Redux and renders the modal
 *
 * Design decisions:
 *   - No third-party UI library dependency — pure CSS-in-JS via inline styles
 *     so microfrontends can add their own design system on top.
 *   - Auto-dismiss timer is managed here via useEffect.
 *   - Animation: CSS transition on the backdrop opacity.
 */

import React, { useEffect, useCallback } from 'react';
import { useModal } from '../hooks/useModal';
import type { ModalConfig, ModalVariant } from '../types';

// ---------------------------------------------------------------------------
// Colour palette per variant
// ---------------------------------------------------------------------------

const VARIANT_COLORS: Record<ModalVariant, { bg: string; border: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#22c55e', icon: '✓' },
  error:   { bg: '#fef2f2', border: '#ef4444', icon: '✕' },
  warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠' },
  info:    { bg: '#eff6ff', border: '#3b82f6', icon: 'ℹ' },
};

// ---------------------------------------------------------------------------
// NotifyModal
// ---------------------------------------------------------------------------

interface NotifyModalProps {
  config: ModalConfig;
  onClose: () => void;
}

export function NotifyModal({ config, onClose }: NotifyModalProps) {
  const { title, message, variant, autoCloseMs, confirmLabel, onConfirm } = config;
  const colors = VARIANT_COLORS[variant];

  // Auto-close timer
  useEffect(() => {
    if (!autoCloseMs || autoCloseMs <= 0) return;
    const timer = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  const handleConfirm = useCallback(() => {
    onConfirm?.();
    onClose();
  }, [onConfirm, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notify-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.45)',
        animation: 'notify-fade-in 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Icon + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span
            style={{
              fontSize: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: colors.border,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {colors.icon}
          </span>
          <h2
            id="notify-modal-title"
            style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a2e' }}
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <p style={{ margin: '0 0 24px', color: '#374151', lineHeight: 1.6 }}>{message}</p>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={onClose}
            style={ghostButtonStyle}
          >
            Close
          </button>
          {confirmLabel && (
            <button
              onClick={handleConfirm}
              style={{ ...ghostButtonStyle, background: colors.border, color: '#fff', border: 'none' }}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>

      {/* Keyframe injection (once per document) */}
      <style>{`
        @keyframes notify-fade-in { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModalProvider — mount once at the root of each microfrontend
// ---------------------------------------------------------------------------

interface ModalProviderProps {
  children: React.ReactNode;
}

/**
 * Reads modal state from Redux and renders <NotifyModal /> when open.
 *
 * Mount at the top of each microfrontend's component tree, inside the Redux Provider:
 *
 * ```tsx
 * <Provider store={store}>
 *   <ModalProvider>
 *     <App />
 *   </ModalProvider>
 * </Provider>
 * ```
 */
export function ModalProvider({ children }: ModalProviderProps) {
  const { isOpen, config, hide } = useModal();

  return (
    <>
      {children}
      {isOpen && config && (
        <NotifyModal config={config} onClose={hide} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const ghostButtonStyle: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: '8px',
  border: '1.5px solid #d1d5db',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  color: '#374151',
  transition: 'background 0.15s',
};
