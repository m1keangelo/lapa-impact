/**
 * Donate Success — /donate/success (master §35–36). Stripe redirects here
 * after checkout. No more 6-digit code: the donor is IN, and we invite them
 * to create their account (same email they gave with) so their gift links
 * to My Impact. Already signed in → straight to the "go to My Impact" state.
 * The share loop stays: "I gave. I watched. This is where it went."
 */
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, HandCoins, Loader2, Share2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { firebaseReady } from '@/lib/firebase';
import {
  authErrorKey,
  linkMyDonations,
  signUpDonor,
  useAuthUser,
} from '@/lib/auth';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function DonateSuccess() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuthUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [shared, setShared] = useState(false);

  const shareProof = async () => {
    const text = t.donate.success.shareText;
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'LAPA.Help', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared(true);
      window.setTimeout(() => setShared(false), 1800);
    } catch {
      // Share sheet dismissed — no-op.
    }
  };

  const createAccount = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setErrorMsg('');
    setBusy(true);
    try {
      await signUpDonor(name, email, password);
      await linkMyDonations();
      navigate('/impact');
    } catch (err) {
      console.error('[donate-success] account creation failed:', err);
      setErrorMsg(t.auth[authErrorKey(err)]);
    } finally {
      setBusy(false);
    }
  };

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.5, ease: EASE },
  });

  const fieldClass =
    'h-12 w-full rounded-[10px] border border-border-strong bg-surface px-4 text-[15px] font-medium text-text placeholder:text-text-faint transition-colors focus:border-amber focus:outline-none';

  return (
    <div className="relative overflow-hidden">
      {/* faint blue glow, matching the FinalCta section */}
      <div
        className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_40%,rgba(23,105,255,0.07),transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[70dvh] w-full max-w-[680px] flex-col items-center justify-center px-5 py-20 text-center">
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
            <Check className="h-10 w-10 text-white" strokeWidth={3} />
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
          {t.donate.success.inBody}
        </motion.p>

        {authLoading ? (
          <motion.div {...rise(0.4)} className="mt-10" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-amber" strokeWidth={1.5} />
          </motion.div>
        ) : user ? (
          /* Already signed in — nothing more to do. */
          <motion.div
            {...rise(0.4)}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <button
              type="button"
              onClick={() => navigate('/impact')}
              className="inline-flex items-center gap-2 rounded-[10px] bg-amber px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
            >
              <HandCoins className="h-4 w-4" />
              {t.donate.success.goToMyImpact}
            </button>
            <Link
              to="/feed"
              className="rounded-[10px] border border-border-strong px-6 py-3.5 text-[15px] font-semibold text-text transition-all duration-150 ease-calm hover:bg-surface-2/60 active:scale-[0.98]"
            >
              {t.donate.success.watchFeed}
            </Link>
          </motion.div>
        ) : (
          /* Create the account that follows the mission (§35–36). */
          <motion.div {...rise(0.4)} className="mt-10 w-full max-w-[420px]">
            <p className="text-[13px] font-medium leading-[1.5] tracking-[0.01em] text-text-muted">
              {t.donate.success.createAccountHint}
            </p>
            <form
              onSubmit={(e) => void createAccount(e)}
              className="mt-6 flex flex-col items-stretch gap-3 text-left"
            >
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
                  autoComplete="new-password"
                  minLength={6}
                  required
                  className={fieldClass}
                />
              </label>

              {errorMsg ? (
                <p className="text-center text-[12px] font-medium leading-[1.4] tracking-[0.01em] text-danger">
                  {errorMsg}{' '}
                  {errorMsg === t.auth.errEmailInUse ? (
                    <Link
                      to="/login"
                      state={{ email }}
                      className="underline decoration-dotted underline-offset-4"
                    >
                      {t.auth.signInCta} →
                    </Link>
                  ) : null}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy || !firebaseReady}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-amber text-[15px] font-semibold text-white transition-all duration-200 ease-calm hover:bg-amber-soft active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.auth.working}
                  </>
                ) : (
                  t.auth.signUpCta
                )}
              </button>
            </form>

            <Link
              to="/feed"
              className="mt-5 inline-block text-[13px] font-semibold text-text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-text"
            >
              {t.donate.success.skipForNow}
            </Link>
          </motion.div>
        )}

        <motion.button
          {...rise(0.55)}
          type="button"
          onClick={() => void shareProof()}
          className="mt-8 inline-flex items-center gap-2 text-[13px] font-semibold text-text-muted underline decoration-dotted underline-offset-4 transition-colors hover:text-text"
        >
          <Share2 className="h-3.5 w-3.5" />
          {shared ? t.donate.success.copied : t.donate.success.shareCta}
        </motion.button>
      </div>
    </div>
  );
}
