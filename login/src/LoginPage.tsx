/**
 * LoginPage — the sign-in screen.
 * Consumed by App.tsx; GoogleOAuthProvider is provided by the parent.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  httpService,
  useHttp,
  useLogger,
  useModal,
  usePortalNavigation,
} from '@notify-ui/shared';

/* ── Types ─────────────────────────────────────────────────────────────────── */

type LoginPhase = 'idle' | 'success';
type AuthMode = 'login' | 'register';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tenantId: string;
  email: string;
  name: string;
}

interface RegistrationResponse {
  clientId: string;
  applicationName: string;
  basePackage: string;
}



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
        ctx.fillStyle = `rgba(129,140,248,${p.alpha})`;
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
            ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 120)})`;
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
        background: disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
        color: '#f1f5f9', fontSize: 15, fontWeight: 600,
        fontFamily: 'Inter, system-ui, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', backdropFilter: 'blur(10px)',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'; }}
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
        const registration = await httpService.post<RegistrationResponse>('/api/admin/auth/register', {
          data: { name, email, password },
        });
        await httpService.post('/api/client/register', {
          data: {
            clientId: registration.data.clientId,
            applicationName: registration.data.applicationName,
            basePackage: registration.data.basePackage,
          },
        });
        log.info('Client registered for new account', { clientId: registration.data.clientId });
      }

      const response = await httpService.post<AuthResponse>('/api/admin/auth/custom-login', {
        data: { email, password },
      });
      return response.data;
    });

    if (auth) completeLogin(auth);
  }, [completeLogin, confirmPassword, email, execute, log, mode, name, password, show]);

  const handleGoogleToken = useCallback(async (idToken: string) => {
    log.info('Submitting Google authentication');
    const auth = await execute(async () => {
      const response = await httpService.post<AuthResponse>('/api/admin/auth/google-login', {
        data: { idToken },
      });
      return response.data;
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
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.06)',
    color: '#f1f5f9', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 420, margin: '0 auto', padding: '0 16px' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />

      <div style={{
        background: 'rgba(15,22,40,0.75)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: '40px 36px',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            fontSize: 26,
          }}>⚡</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5, color: '#f1f5f9', margin: 0 }}>
            Notify Admin
          </h1>
          <p style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
            Sign in to access the admin portal
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
                <button key={nextMode} type="button" onClick={() => { setMode(nextMode); setPhase('idle'); }} style={{ border: 0, borderRadius: 6, padding: '9px 12px', background: mode === nextMode ? '#4f46e5' : 'transparent', color: mode === nextMode ? '#fff' : '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
                  {nextMode}
                </button>
              ))}
            </div>

            <form onSubmit={handleCredentials} style={{ display: 'grid', gap: 12 }}>
              {mode === 'register' && <input required value={name} onChange={event => setName(event.target.value)} placeholder="Full name" autoComplete="name" style={fieldStyle} />}
              <input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" style={fieldStyle} />
              <input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} style={fieldStyle} />
              {mode === 'register' && <input required minLength={8} type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm password" autoComplete="new-password" style={fieldStyle} />}
              <button disabled={loading} type="submit" style={{ width: '100%', padding: '13px 20px', border: 0, borderRadius: 8, background: loading ? '#3730a3' : '#4f46e5', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'wait' : 'pointer' }}>
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
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 60% 0%, #0d1433 0%, #080c18 60%, #020408 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <AnimatedBackground />
      <div style={{ position: 'fixed', top: '-15vw', right: '-10vw', width: '40vw', height: '40vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20vw', left: '-10vw', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <LoginCard />
    </div>
  );
}
