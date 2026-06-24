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
// Variant icons retain the message meaning while the modal itself uses the shared
// black-and-gold application theme.
// ---------------------------------------------------------------------------

const VARIANT_ICONS: Record<ModalVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '!',
  info: 'i',
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
  const icon = VARIANT_ICONS[variant];

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
        backgroundColor: 'rgba(0,0,0,0.74)',
        backdropFilter: 'blur(8px)',
        animation: 'notify-fade-in 0.15s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'rgba(17,17,13,0.96)',
          border: '1px solid rgba(250,204,21,0.48)',
          borderRadius: '12px',
          padding: '28px',
          maxWidth: '480px',
          width: '90%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.64), inset 0 1px 0 rgba(250,204,21,0.12)',
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
              borderRadius: '8px',
              border: '1px solid #facc15',
              background: 'transparent',
              color: '#facc15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </span>
          <h2
            id="notify-modal-title"
            style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fde047' }}
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <p style={{ margin: '0 0 24px', color: '#d0c9a8', lineHeight: 1.6 }}>{message}</p>

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
              style={{ ...ghostButtonStyle, borderColor: '#fde047', color: '#fde047' }}
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
  border: '1px solid rgba(250,204,21,0.7)',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 700,
  color: '#facc15',
  transition: 'border-color 0.15s, color 0.15s',
};
