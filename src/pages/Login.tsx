/**
 * Donor sign-in — /login (master §35–37). Email + password accounts replace
 * the old 6-digit code: DONATE → EMAIL → ACCOUNT → MY IMPACT. One quiet card
 * over the dimmed login-bg: sign in by default, flip to create-account,
 * forgot-password reset via email. Field team routes to /admin instead.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { firebaseReady } from '@/lib/firebase';
import {
  authErrorKey,
  resetDonorPassword,
  signInDonor,
  signUpDonor,
  useAuthUser,
} from '@/lib/auth';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Mode = 'in' | 'up';

interface LocationState {
  from?: string;
  email?: string;
  mode?: Mode;
}

export default function Login() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const { user, loading } = useAuthUser();

  const state = (location.state ?? {}) as LocationState;
  const [mode, setMode] = useState<Mode>(state.mode === 'up' ? 'up' : 'in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(state.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);

  // Gentle toast when redirected here from /impact without a session.
  useEffect(() => {
    if (state.from === 'impact') {
      toast(t.login.toastFromImpact, {
        icon: <ArrowLeft className="h-4 w-4 rotate-180 text-amber" />,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard-aware layout: when the mobile keyboard opens, anchor to top.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => setKbOpen(vv.height < window.innerHeight * 0.75);
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrorMsg('');
    setResetSent(false);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErrorMsg('');
    setResetSent(false);
    setBusy(true);
    try {
      if (mode === 'up') {
        await signUpDonor(name, email, password);
      } else {
        await signInDonor(email, password);
      }
      navigate('/impact');
    } catch (err) {
      console.error('[login] auth failed:', err);
      setErrorMsg(t.auth[authErrorKey(err)]);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (busy || !email.trim()) {
      setErrorMsg(t.auth.errInvalidEmail);
      return;
    }
    setErrorMsg('');
    setBusy(true);
    try {
      await resetDonorPassword(email);
      setResetSent(true);
    } catch (err) {
      console.error('[login] reset failed:', err);
      setErrorMsg(t.auth[authErrorKey(err)]);
    } finally {
      setBusy(false);
    }
  };

  // Already signed in → straight to My Impact (after all hooks).
  if (!loading && user) {
    return <Navigate to="/impact" replace />;
  }

  const introStagger = (i: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: reduceMotion ? 0 : 0.08 + i * 0.06,
      duration: reduceMotion ? 0 : 0.5,
      ease: EASE,
    },
  });

  const fieldClass =
    'h-12 w-full rounded-[10px] border border-border-strong bg-surface px-4 text-[15px] font-medium text-text placeholder:text-text-faint transition-colors focus:border-amber focus:outline-none';

  return (
    <div className="relative flex min-h-full flex-col overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          },
        }}
      />

      {/* Dimmed bokeh background + lantern glow */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <img
          src="/login-bg.jpg"
          alt=""
          className="h-full w-full object-cover opacity-[0.15]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(520px_circle_at_50%_42%,rgba(0,61,122,0.08),transparent_70%)]" />
      </div>

      <div
        className={cn(
          'relative z-10 mx-auto flex w-full max-w-[460px] flex-1 flex-col items-center px-5 pb-16',
          kbOpen ? 'justify-start pt-12' : 'justify-center py-10',
        )}
      >
        <div className="mb-8 w-full">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-[0.01em] text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t.auth.back}
          </Link>
        </div>

        {/* Intro block — logo static (images never animate) */}
        <img src="/logo-mark.png" alt="" className="h-14 w-14 rounded-full" />
        <motion.h1
          {...introStagger(1)}
          className="mt-5 text-center font-display text-2xl font-medium leading-[1.2] tracking-[-0.01em] text-text md:text-[32px]"
        >
          {mode === 'up' ? t.auth.signUpTitle : t.auth.signInTitle}
        </motion.h1>
        {!kbOpen && (
          <motion.p
            {...introStagger(2)}
            className="mt-3 max-w-[40ch] text-center text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted"
          >
            {mode === 'up' ? t.auth.signUpIntro : t.auth.signInIntro}
          </motion.p>
        )}

        {/* Email + password form — static (forms never animate) */}
        <form
          onSubmit={(e) => void submit(e)}
          className="mt-8 flex w-full flex-col items-stretch gap-3"
        >
          {mode === 'up' ? (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                {t.auth.nameLabel}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.auth.namePh}
                autoComplete="given-name"
                required
                className={fieldClass}
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {t.auth.emailLabel}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.auth.emailPh}
              autoComplete="email"
              inputMode="email"
              required
              autoFocus={mode === 'in'}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {t.auth.passwordLabel}
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.auth.passwordPh}
              autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
              minLength={6}
              required
              className={fieldClass}
            />
          </label>

          {errorMsg ? (
            <p className="text-center text-[12px] font-medium leading-[1.4] tracking-[0.01em] text-danger">
              {errorMsg}
            </p>
          ) : null}
          {resetSent ? (
            <p className="text-center text-[12px] font-medium leading-[1.4] tracking-[0.01em] text-sage">
              {t.auth.resetSent}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy || !firebaseReady}
            className={cn(
              'mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-amber text-[15px] font-semibold text-white transition-all duration-200 ease-calm hover:bg-amber-soft active:scale-[0.98]',
              (busy || !firebaseReady) && 'cursor-not-allowed opacity-50',
            )}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.auth.working}
              </>
            ) : mode === 'up' ? (
              t.auth.signUpCta
            ) : (
              t.auth.signInCta
            )}
          </button>

          <div className="mt-1 flex items-center justify-between text-[12px] font-medium tracking-[0.01em]">
            <button
              type="button"
              onClick={() => switchMode(mode === 'up' ? 'in' : 'up')}
              className="text-amber transition-colors hover:text-amber-soft"
            >
              {mode === 'up' ? t.auth.switchToIn : t.auth.switchToUp}
            </button>
            {mode === 'in' ? (
              <button
                type="button"
                onClick={() => void forgot()}
                className="text-text-faint transition-colors hover:text-text-muted"
              >
                {t.auth.forgot}
              </button>
            ) : null}
          </div>
        </form>

        {/* Secondary links — static */}
        <div className="mt-12 flex flex-col items-center gap-2.5 text-center text-[13px] font-medium tracking-[0.01em] text-text-muted">
          <p>
            {t.auth.visiting}{' '}
            <Link to="/feed" className="text-amber transition-colors hover:text-amber-soft">
              {t.auth.watchFeed}
            </Link>
          </p>
          <p className="text-text-faint">
            {t.auth.fieldTeam}{' '}
            <Link to="/admin" className="transition-colors hover:text-text-muted">
              {t.auth.teamSignIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
