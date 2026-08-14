/**
 * Donate Success — /donate/success?session_id={CHECKOUT_SESSION_ID}.
 * The Stripe Payment Link redirects here after hosted checkout. The page
 * polls the public `lookupDonation` Cloud Function every 2s (up to 45s)
 * until the webhook has written `stripeSessions/{sessionId}`, then shows
 * the generated 6-digit donor code, auto-saves it to the session, and
 * routes the donor onward. Four states: confirming / confirmed / timeout /
 * unavailable (missing session id or functions base URL).
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  Copy,
  HandCoins,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { FUNCTIONS_BASE_URL } from '@/lib/donate';
import { setDonorCode } from '@/lib/session';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 45000;

type Phase = 'confirming' | 'confirmed' | 'timeout' | 'unavailable';

export default function DonateSuccess() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  const [phase, setPhase] = useState<Phase>(() =>
    sessionId && FUNCTIONS_BASE_URL ? 'confirming' : 'unavailable',
  );
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  // Poll lookupDonation until confirmed or the 45s budget runs out.
  useEffect(() => {
    if (phase !== 'confirming' || !sessionId || !FUNCTIONS_BASE_URL) return;

    let cancelled = false;
    const started = Date.now();

    const tick = async () => {
      if (cancelled) return;
      if (Date.now() - started >= POLL_TIMEOUT_MS) {
        setPhase('timeout');
        return;
      }
      try {
        const url = `${FUNCTIONS_BASE_URL}/lookupDonation?session_id=${encodeURIComponent(sessionId)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as { status?: string; code?: string };
          if (data.status === 'confirmed' && typeof data.code === 'string') {
            setCode(data.code);
            setDonorCode(data.code); // already logged in for /impact
            setPhase('confirmed');
            return;
          }
        }
      } catch {
        // Network hiccup — keep polling until the timeout budget expires.
      }
      window.setTimeout(tick, POLL_INTERVAL_MS);
    };

    const first = window.setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
    };
  }, [phase, sessionId]);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard API unavailable (insecure context) — select fallback.
    }
    setCopied(true);
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1800);
  };

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.5, ease: EASE },
  });

  return (
    <div className="relative overflow-hidden">
      {/* radial amber glow, matching the FinalCta section */}
      <div
        className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_40%,rgba(232,163,61,0.12),transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[70dvh] w-full max-w-[680px] flex-col items-center justify-center px-5 py-20 text-center">
        {phase === 'confirming' ? (
          <>
            <motion.div {...rise(0)} aria-hidden>
              <Loader2 className="h-12 w-12 animate-spin text-amber" strokeWidth={1.5} />
            </motion.div>
            <motion.h1
              {...rise(0.1)}
              className="mt-8 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl"
              role="status"
              aria-label={t.donate.success.loadingAria}
            >
              {t.donate.success.confirmingTitle}
            </motion.h1>
            <motion.p
              {...rise(0.2)}
              className="mt-4 max-w-[46ch] text-[15px] leading-[1.55] text-text-muted"
            >
              {t.donate.success.confirmingBody}
            </motion.p>
          </>
        ) : null}

        {phase === 'confirmed' && code ? (
          <>
            {/* Amber check pop with radiating pulse */}
            <motion.div className="relative" aria-hidden>
              {!reduceMotion ? (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-amber"
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: 0, scale: 2.2 }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.35 }}
                />
              ) : null}
              <motion.div
                initial={reduceMotion ? false : { scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-amber"
              >
                <Check className="h-10 w-10 text-[#1A130B]" strokeWidth={3} />
              </motion.div>
            </motion.div>

            <motion.h1
              {...rise(0.2)}
              className="mt-8 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl"
            >
              {t.donate.success.confirmedTitle}
            </motion.h1>
            <motion.p
              {...rise(0.3)}
              className="mt-4 max-w-[50ch] text-[15px] leading-[1.55] text-text-muted"
            >
              {t.donate.success.confirmedBody}
            </motion.p>

            {/* The code, HUGE */}
            <motion.div {...rise(0.4)} className="mt-10 w-full">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
                {t.donate.success.yourCode}
              </p>
              <div className="mt-3 flex flex-col items-center gap-4 rounded-card border border-amber/40 bg-surface px-6 py-8">
                <p
                  className="select-all break-all font-mono text-4xl font-medium tracking-[0.08em] text-text md:text-6xl"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {code}
                </p>
                <button
                  type="button"
                  onClick={copyCode}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[10px] border border-border-strong px-4 py-2 text-sm font-semibold transition-all duration-150 ease-calm active:scale-[0.98]',
                    copied
                      ? 'border-amber text-amber'
                      : 'text-text hover:bg-surface-2',
                  )}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? t.common.copied : t.donate.success.copyCode}
                </button>
              </div>
              <p className="mt-3 text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted">
                {t.donate.success.codeHint}
              </p>
            </motion.div>

            <motion.div
              {...rise(0.5)}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
            >
              <button
                type="button"
                onClick={() => navigate('/impact')}
                className="inline-flex items-center gap-2 rounded-[10px] bg-amber px-6 py-3.5 text-[15px] font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
              >
                <HandCoins className="h-4 w-4" />
                {t.donate.success.seeMyImpact}
              </button>
              <Link
                to="/feed"
                className="rounded-[10px] border border-border-strong px-6 py-3.5 text-[15px] font-semibold text-text transition-all duration-150 ease-calm hover:bg-surface-2/60 active:scale-[0.98]"
              >
                {t.donate.success.watchFeed}
              </Link>
            </motion.div>
          </>
        ) : null}

        {phase === 'timeout' ? (
          <>
            <motion.div {...rise(0)} aria-hidden>
              <AlertTriangle className="h-12 w-12 text-amber" strokeWidth={1.5} />
            </motion.div>
            <motion.h1
              {...rise(0.1)}
              className="mt-8 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl"
            >
              {t.donate.success.timeoutTitle}
            </motion.h1>
            <motion.p
              {...rise(0.2)}
              className="mt-4 max-w-[46ch] text-[15px] leading-[1.55] text-text-muted"
            >
              {t.donate.success.timeoutBody}
            </motion.p>
            <motion.p
              {...rise(0.3)}
              className="mt-3 max-w-[46ch] text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-faint"
            >
              {t.donate.success.contactNote}
            </motion.p>
            <motion.div {...rise(0.4)} className="mt-10">
              <Link
                to="/"
                className="rounded-[10px] border border-border-strong px-6 py-3.5 text-[15px] font-semibold text-text transition-all duration-150 ease-calm hover:bg-surface-2/60 active:scale-[0.98]"
              >
                {t.donate.success.backHome}
              </Link>
            </motion.div>
          </>
        ) : null}

        {phase === 'unavailable' ? (
          <>
            <motion.div {...rise(0)} aria-hidden>
              <HandCoins className="h-12 w-12 text-amber" strokeWidth={1.5} />
            </motion.div>
            <motion.h1
              {...rise(0.1)}
              className="mt-8 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl"
            >
              {t.donate.success.unavailableTitle}
            </motion.h1>
            <motion.p
              {...rise(0.2)}
              className="mt-4 max-w-[46ch] text-[15px] leading-[1.55] text-text-muted"
            >
              {t.donate.success.unavailableBody}
            </motion.p>
            <motion.div
              {...rise(0.3)}
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
            >
              <Link
                to="/"
                className="rounded-[10px] bg-amber px-6 py-3.5 text-[15px] font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
              >
                {t.donate.success.backHome}
              </Link>
              <Link
                to="/feed"
                className="rounded-[10px] border border-border-strong px-6 py-3.5 text-[15px] font-semibold text-text transition-all duration-150 ease-calm hover:bg-surface-2/60 active:scale-[0.98]"
              >
                {t.donate.success.watchFeed}
              </Link>
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  );
}
