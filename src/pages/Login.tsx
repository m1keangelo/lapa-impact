/**
 * Donor Login — /login (login.md). Quiet single-card page floating over a
 * dimmed login-bg.jpg: intro block, the signature CodeInput, validation
 * sequences (checking / found / not-found) and low-key secondary links.
 *
 * Valid codes: Firestore getDoc(donors/{code}) when configured; in demo
 * mode any donorCode present in demoData (e.g. X7kQ2mPv9Rt4) is accepted.
 * On success the code is persisted via session helpers and we route to
 * /impact. Supports a prefilled code via location.state.code or ?code= —
 * validation auto-fires after 400ms (login.md "Page transition").
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import CodeInput, { type CodeInputStatus } from '@/components/CodeInput';
import { db, firebaseReady } from '@/lib/firebase';
import { demoDonations } from '@/lib/demoData';
import {
  DONOR_CODE_LENGTH,
  getDonorCode,
  isPlausibleDonorCode,
  setDonorCode,
} from '@/lib/session';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type Phase = 'idle' | 'checking' | 'found' | 'notfound';

const DEMO_HINT_CODE = demoDonations[0]?.donorCode ?? '';

interface LocationState {
  code?: string;
  from?: string;
}

export default function Login() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [firstName, setFirstName] = useState('');
  const [kbOpen, setKbOpen] = useState(false);
  const busy = phase === 'checking' || phase === 'found';
  const timers = useRef<number[]>([]);

  const state = (location.state ?? {}) as LocationState;

  // Gentle toast when redirected here from /impact without a session.
  useEffect(() => {
    if (state.from === 'impact') {
      toast('Enter your code to see your impact.', {
        icon: <ArrowRight className="h-4 w-4 text-amber" />,
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

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const after = (ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const fail = useCallback((message: string) => {
    setErrorMsg(message);
    setPhase('notfound');
  }, []);

  const submit = useCallback(
    async (rawCode: string) => {
      const candidate = rawCode.trim();
      if (!isPlausibleDonorCode(candidate) || phase === 'checking' || phase === 'found') return;
      setErrorMsg('');
      setPhase('checking');

      if (!firebaseReady || !db) {
        // Demo mode: accept any donor code present in the bundled demo data.
        await new Promise((r) => setTimeout(r, 650)); // let "checking" breathe
        const gift = demoDonations.find((d) => d.donorCode === candidate);
        if (gift) {
          const name = gift.donorName ?? 'friend';
          setFirstName(name.split(' ')[0] ?? name);
          setPhase('found');
          setDonorCode(candidate);
          after(1000, () => navigate('/impact'));
        } else {
          fail(
            "We couldn't find that code. Check for typos — or contact the mission if it should work.",
          );
        }
        return;
      }

      try {
        const snap = await getDoc(doc(db, 'donors', candidate));
        if (snap.exists()) {
          const name = (snap.data().name as string | undefined) ?? 'friend';
          setFirstName(name.trim().split(/\s+/)[0] ?? 'friend');
          setPhase('found');
          setDonorCode(candidate);
          after(1000, () => navigate('/impact'));
        } else {
          fail(
            "We couldn't find that code. Check for typos — or contact the mission if it should work.",
          );
        }
      } catch (err) {
        console.error('[login] donor lookup failed:', err);
        fail('We had trouble reaching the field ledger. Check your connection and try again.');
      }
    },
    [phase, fail, navigate],
  );

  // Prefilled code (from home CTA or ?code=): ripple-fill then auto-validate after 400ms.
  useEffect(() => {
    const prefill = (state.code ?? searchParams.get('code') ?? '').trim();
    if (!prefill || !isPlausibleDonorCode(prefill)) return;
    setCode(prefill);
    const t = window.setTimeout(() => void submit(prefill), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const codeStatus: CodeInputStatus =
    phase === 'checking' ? 'checking' : phase === 'found' ? 'success' : phase === 'notfound' ? 'error' : 'idle';

  const complete = code.length === DONOR_CODE_LENGTH;

  // Already signed in → straight to the dashboard (after all hooks).
  if (getDonorCode() && phase === 'idle' && !state.from) {
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

      {/* Dimmed bokeh background + lantern glow (login.md) */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <img
          src="/login-bg.jpg"
          alt=""
          className="h-full w-full object-cover opacity-[0.15]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(520px_circle_at_50%_42%,rgba(232,163,61,0.12),transparent_70%)]" />
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
            Back to home
          </Link>
        </div>

        {/* Intro block */}
        <motion.img
          src="/logo.svg"
          alt=""
          initial={reduceMotion ? false : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.8, ease: EASE }}
          className="h-10 w-10"
        />
        <motion.h1
          {...introStagger(1)}
          className="mt-5 text-center font-display text-2xl font-medium leading-[1.2] tracking-[-0.01em] text-text md:text-[32px]"
        >
          Welcome back, neighbor.
        </motion.h1>
        {!kbOpen && (
          <motion.p
            {...introStagger(3)}
            className="mt-3 max-w-[40ch] text-center text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted"
          >
            Enter the 12-character code from your giving receipt or welcome
            letter. It's yours alone — keep it private.
          </motion.p>
        )}

        {/* Code input */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.3, duration: 0.4 }}
          className="mt-9 flex flex-col items-center"
        >
          <CodeInput
            value={code}
            onChange={(c) => {
              setCode(c);
              if (phase === 'notfound') {
                setPhase('idle');
                setErrorMsg('');
              }
            }}
            status={codeStatus}
            disabled={busy}
            autoFocus
            onSubmitCode={(c) => void submit(c)}
          />
          <p className="mt-3 text-center text-[12px] font-medium tracking-[0.01em] text-text-faint">
            Letters and numbers — no 0, O, I, or l.
          </p>

          {/* Inline error, slides down */}
          <AnimatePresence initial={false}>
            {phase === 'notfound' && errorMsg ? (
              <motion.div
                key="error"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden"
              >
                <p className="mt-3 max-w-[42ch] text-center text-[12px] font-medium leading-[1.4] tracking-[0.01em] text-danger">
                  {errorMsg}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="button"
            onClick={() => void submit(code)}
            disabled={!complete || busy}
            initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.7, duration: 0.4, ease: EASE }}
            className={cn(
              'mt-6 flex h-12 w-full min-w-[280px] items-center justify-center gap-2 rounded-[10px] text-[15px] font-semibold transition-all duration-200 ease-calm active:scale-[0.98] md:min-w-[340px]',
              phase === 'found'
                ? 'bg-sage text-[#14100C]'
                : 'bg-amber text-[#1A130B] hover:bg-amber-soft',
              (!complete || busy) && phase !== 'found' && 'cursor-not-allowed opacity-50',
              phase === 'found' && 'cursor-default',
            )}
          >
            {phase === 'checking' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding your ledger…
              </>
            ) : phase === 'found' ? (
              <>
                Welcome, {firstName}
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              'See my impact'
            )}
          </motion.button>

          {!firebaseReady && DEMO_HINT_CODE ? (
            <button
              type="button"
              onClick={() => {
                setCode(DEMO_HINT_CODE);
                after(400, () => void submit(DEMO_HINT_CODE));
              }}
              className="mt-4 font-mono text-[12px] tracking-[0.01em] text-text-faint transition-colors hover:text-amber"
            >
              Preview mode — tap to try demo code {DEMO_HINT_CODE}
            </button>
          ) : null}
        </motion.div>

        {/* Secondary links — fade in last */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 1, duration: 0.5 }}
          className="mt-12 flex flex-col items-center gap-2.5 text-center text-[13px] font-medium tracking-[0.01em] text-text-muted"
        >
          <p>
            Just visiting? →{' '}
            <Link to="/feed" className="text-amber transition-colors hover:text-amber-soft">
              Watch the public feed
            </Link>
          </p>
          <p className="text-text-faint">
            Field team? →{' '}
            <Link to="/admin" className="transition-colors hover:text-text-muted">
              Admin sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
