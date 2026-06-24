/**
 * LoginPage — the sign-in screen.
 * Consumed by App.tsx; GoogleOAuthProvider is provided by the parent.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import {
  useHttp,
  useLogger,
  useModal,
  usePortalNavigation,
  login as loginThunk,
  googleLogin as googleLoginThunk,
  createClient as createClientThunk,
} from '@notify-ui/shared';
import type { AuthResponse, RegistrationResponse } from '@notify-ui/shared';

/* ── Types ─────────────────────────────────────────────────────────────────── */

type LoginPhase = 'idle' | 'success';
type AuthMode = 'login' | 'register';

// using AuthResponse and RegistrationResponse from shared



/* ── Animated Background ────────────────────────────────────────────────────── */

function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250,204,21,${p.alpha})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(250,204,21,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    draw();
    const onResize = () => { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

/* ── Google Sign-In Button ──────────────────────────────────────────────────── */

function GoogleSignInButton({
  onSignIn,
  onError,
  disabled,
}: {
  onSignIn: (idToken: string) => void;
  onError: () => void;
  disabled: boolean;
}) {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) =>
      onSignIn((tokenResponse as any).credential ?? (tokenResponse as any).access_token ?? ''),
    onError,
    flow: 'implicit',
  });

  return (
    <button
      onClick={() => !disabled && login()}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        width: '100%', padding: '13px 20px',
        background: 'transparent',
        border: `1px solid ${disabled ? 'rgba(250,204,21,0.28)' : 'rgba(250,204,21,0.24)'}`, borderRadius: 12,
        color: disabled ? '#8d855f' : '#fde047', fontSize: 15, fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = '#fde047'; }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(250,204,21,0.24)'; }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
      Continue with Google
    </button>
  );
}

/* ── Login Card ─────────────────────────────────────────────────────────────── */

function LoginCard() {
  const [phase, setPhase] = useState<LoginPhase>('idle');
  const [mode, setMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { loading, execute } = useHttp<AuthResponse>();
  const { show } = useModal();
  const log = useLogger('LoginPortal');
  const { navigate, setTokenCookie, getRedirectTarget } = usePortalNavigation();
  const dispatch = useDispatch<any>();

  const completeLogin = useCallback((auth: AuthResponse) => {
    setTokenCookie(auth.accessToken);
    setUser({ name: auth.name, email: auth.email });
    setPhase('success');
    log.info('Authentication succeeded', { email: auth.email });
    show({
      title: 'Signed in',
      message: `Welcome, ${auth.name || auth.email}.`,
      variant: 'success',
      autoCloseMs: 1000,
    });
    setTimeout(() => {
      const redirect = getRedirectTarget();
      if (redirect) {
        window.location.href = redirect;
      } else {
        navigate('events');
      }
    }, 1200);
  }, [log, navigate, show]);

  const handleCredentials = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'register' && password !== confirmPassword) {
      show({
        title: 'Check your password',
        message: 'The password confirmation does not match.',
        variant: 'warning',
        autoCloseMs: 0,
      });
      return;
    }

    log.info('Submitting credential workflow', { mode });
    const auth = await execute(async () => {
      if (mode === 'register') {
        const registration = await dispatch(createClientThunk({ name, email, password })).unwrap();
        log.info('Client registered for new account', { clientId: registration.clientId });
      }

      const response = await dispatch(loginThunk({ email, password })).unwrap();
      return response;
    });

    if (auth) completeLogin(auth);
  }, [completeLogin, confirmPassword, email, execute, log, mode, name, password, show]);

  const handleGoogleToken = useCallback(async (idToken: string) => {
    log.info('Submitting Google authentication');
    const auth = await execute(async () => {
      const response = await dispatch(googleLoginThunk(idToken)).unwrap();
      return response;
    });
    if (auth) completeLogin(auth);
  }, [completeLogin, execute, log]);

  const handleGoogleError = useCallback(() => {
    log.error('Google OAuth failed');
    show({
      title: 'Google sign-in failed',
      message: 'Google could not complete the sign-in request. Please try again.',
      variant: 'error',
      autoCloseMs: 0,
    });
  }, [log, show]);

  const fieldStyle: React.CSSProperties = {
    padding: '12px 14px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
    color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  };

  const borderStyle: React.CSSProperties = {
    background: 'rgba(17,17,13,0.88)',
    border: '1px solid rgba(250,204,21,0.24)',
    borderRadius: 24, padding: '40px 36px',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
    position: 'relative',
  }

  const borderButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 20px',
    border: `1px solid ${loading ? 'rgba(250,204,21,0.28)' : 'rgba(250,204,21,0.24)'}`,
    borderRadius: 8,
    background: 'transparent',
    color: loading ? '#8d855f' : '#fde047',
    fontSize: 12,
    fontWeight: 700,
    cursor: loading ? 'wait' : 'pointer'
  }

  return (
    <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, margin: '0 auto', padding: '0 16px' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(250,204,21,0.18) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={borderStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36, cursor: 'pointer' }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', display: 'inline-block' }}>
            <span style={{ color: '#ffffff' }}>Notify</span>
            <span style={{ background: 'linear-gradient(135deg, #facc15 0%, #fde047 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>.ai</span>
          </div>
          <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
            Admin console
          </p>
        </div>

        {phase === 'success' && user && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>✓</div>
            <div style={{ color: '#22c55e', fontWeight: 600 }}>Welcome, {user.name}!</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Redirecting…</div>
          </div>
        )}

        {phase !== 'success' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, marginBottom: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
              {(['login', 'register'] as const).map((nextMode) => (
                <button key={nextMode} type="button" onClick={() => { setMode(nextMode); setPhase('idle'); }} style={{
                  border: `1px solid ${mode == nextMode ? '#fde047' : 'rgba(250,204,21,0.24)'}`,
                  borderRadius: 6,
                  padding: '9px 12px',
                  background: 'transparent',
                  color: mode === nextMode ? '#fde047' : 'rgba(250,204,21,0.24)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 700, textTransform: 'capitalize'
                }}>
                  {nextMode}
                </button>
              ))}
            </div>

            <form onSubmit={handleCredentials} style={{ display: 'grid', gap: 12 }}>
              {mode === 'register' && <input required value={name} onChange={event => setName(event.target.value)} placeholder="Full name" autoComplete="name" style={fieldStyle} />}
              <input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" style={fieldStyle} />
              <input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} style={fieldStyle} />
              {mode === 'register' && <input required minLength={8} type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm password" autoComplete="new-password" style={fieldStyle} />}
              <button disabled={loading} type="submit" style={borderButtonStyle}>
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ color: '#64748b', fontSize: 12 }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            </div>

            <GoogleSignInButton onSignIn={handleGoogleToken} onError={handleGoogleError} disabled={loading} />
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', marginTop: 16, color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
            Verifying your credentials…
          </div>
        )}

      </div>

      <p style={{ textAlign: 'center', marginTop: 24, color: '#334155', fontSize: 12 }}>
        Access restricted to authorized administrators only.
      </p>
    </div>
  );
}

/* ── Page export ────────────────────────────────────────────────────────────── */

export default function LoginPage() {
  return (
    <div style={{
      minHeight: '100dvh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#090909',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <AnimatedBackground />
      <LoginCard />
    </div>
  );
}
