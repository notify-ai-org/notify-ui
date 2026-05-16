import React, { useEffect, useRef, useState } from 'react';

/* ──────────────────────────────────────────────────────────────────────────── */
/*  ANIMATED GLITCH NUMBER                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

function GlitchText({ text }: { text: string }) {
  const [glitched, setGlitched] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setGlitched(true);
      setTimeout(() => setGlitched(false), 150);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={{
          fontSize: 'clamp(100px, 18vw, 180px)',
          fontWeight: 900,
          letterSpacing: -4,
          lineHeight: 1,
          background: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #ef4444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: glitched ? 'blur(1px)' : 'none',
          display: 'block',
          transition: 'filter 0.05s',
          userSelect: 'none',
        }}
      >
        {text}
      </span>
      {/* Glitch pseudo-layers */}
      {glitched && (
        <>
          <span aria-hidden style={{
            position: 'absolute',
            top: 0,
            left: 0,
            fontSize: 'clamp(100px, 18vw, 180px)',
            fontWeight: 900,
            letterSpacing: -4,
            lineHeight: 1,
            color: '#3b82f6',
            opacity: 0.5,
            transform: 'translate(-3px, 2px)',
            display: 'block',
            userSelect: 'none',
            mixBlendMode: 'screen',
          }}>{text}</span>
          <span aria-hidden style={{
            position: 'absolute',
            top: 0,
            left: 0,
            fontSize: 'clamp(100px, 18vw, 180px)',
            fontWeight: 900,
            letterSpacing: -4,
            lineHeight: 1,
            color: '#22c55e',
            opacity: 0.4,
            transform: 'translate(3px, -2px)',
            display: 'block',
            userSelect: 'none',
            mixBlendMode: 'screen',
          }}>{text}</span>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  ANIMATED RING                                                               */
/* ──────────────────────────────────────────────────────────────────────────── */

function ShieldIcon() {
  return (
    <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
      {/* Pulse rings */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1px solid rgba(239,68,68,0.3)',
          animation: `pulse-ring 2.4s ${i * 0.4}s ease-out infinite`,
        }} />
      ))}
      {/* Icon */}
      <div style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background: 'rgba(239,68,68,0.12)',
        border: '1px solid rgba(239,68,68,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
      }}>
        🚫
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  SCANLINES OVERLAY                                                            */
/* ──────────────────────────────────────────────────────────────────────────── */

function ScanLines() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
      }}
    />
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  ANIMATED GRID BACKGROUND                                                    */
/* ──────────────────────────────────────────────────────────────────────────── */

function GridBackground() {
  return (
    <div aria-hidden style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      backgroundImage: `
        linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
    }} />
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  LOGOUT HELPER                                                               */
/* ──────────────────────────────────────────────────────────────────────────── */

async function logout() {
  // Clear the auth cookie
  document.cookie = 'notify_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  // Best-effort server logout
  try {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
  } catch { /* ignore */ }
  window.location.href = '/portals/login';
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  MAIN COMPONENT                                                              */
/* ──────────────────────────────────────────────────────────────────────────── */

export default function ForbiddenPage() {
  const [hoverDash, setHoverDash] = useState(false);
  const [hoverLogout, setHoverLogout] = useState(false);

  // Read referrer from URL for a friendlier message
  const params = new URLSearchParams(window.location.search);
  const resource = params.get('resource') ?? 'this page';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#07090f',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      padding: '40px 24px',
    }}>
      <GridBackground />
      <ScanLines />

      {/* Top-right decorative hex border */}
      <div aria-hidden style={{
        position: 'fixed',
        top: -200,
        right: -200,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        maxWidth: 540,
        animation: 'slideUp 0.5s ease',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 40,
          padding: '5px 14px',
          marginBottom: 32,
          fontSize: 12,
          fontWeight: 600,
          color: '#ef4444',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'blink 1.2s ease infinite',
            display: 'inline-block',
          }} />
          Access Denied
        </div>

        <ShieldIcon />

        {/* 403 glitch */}
        <GlitchText text="403" />

        {/* Heading */}
        <h1 style={{
          fontSize: 'clamp(20px, 3vw, 28px)',
          fontWeight: 700,
          color: '#f1f5f9',
          marginTop: 16,
          marginBottom: 12,
          letterSpacing: -0.5,
        }}>
          Forbidden
        </h1>

        {/* Description */}
        <p style={{
          color: '#475569',
          fontSize: 15,
          lineHeight: 1.7,
          marginBottom: 40,
          maxWidth: 400,
          margin: '0 auto 40px',
        }}>
          You don't have permission to access{' '}
          <code style={{
            color: '#94a3b8',
            background: 'rgba(255,255,255,0.06)',
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: 13,
          }}>
            {resource}
          </code>
          . Please contact your administrator or return to the dashboard.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { window.location.href = '/portals/events'; }}
            onMouseEnter={() => setHoverDash(true)}
            onMouseLeave={() => setHoverDash(false)}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: 'none',
              background: hoverDash
                ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.2s',
              boxShadow: hoverDash ? '0 8px 24px rgba(99,102,241,0.4)' : '0 4px 12px rgba(99,102,241,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            ← Go to Dashboard
          </button>

          <button
            onClick={logout}
            onMouseEnter={() => setHoverLogout(true)}
            onMouseLeave={() => setHoverLogout(false)}
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: '1px solid rgba(239,68,68,0.3)',
              background: hoverLogout ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.06)',
              color: '#ef4444',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Sign Out
          </button>
        </div>

        {/* Decorative code block */}
        <div style={{
          marginTop: 56,
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: '16px 20px',
          textAlign: 'left',
          fontFamily: 'JetBrains Mono, Menlo, monospace',
          fontSize: 12,
          lineHeight: 1.8,
          color: '#334155',
        }}>
          <span style={{ color: '#ef4444' }}>HTTP</span>
          <span style={{ color: '#475569' }}> 403 </span>
          <span style={{ color: '#f59e0b' }}>Forbidden</span>
          <br />
          <span style={{ color: '#334155' }}>X-Error-Code: </span>
          <span style={{ color: '#94a3b8' }}>ACCESS_DENIED</span>
          <br />
          <span style={{ color: '#334155' }}>X-Request-Id: </span>
          <span style={{ color: '#64748b' }}>{Math.random().toString(36).slice(2, 18)}</span>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.6 }
          100% { transform: scale(1.8); opacity: 0 }
        }
        @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
        @font-face {
          font-family: 'JetBrains Mono';
          src: local('Menlo'), local('Courier New');
        }
      `}</style>
    </div>
  );
}
