/**
 * Section 0 — Auth gate (signed-out state). Centered 400px card on bg:
 * "Field desk.", email + password (48px, amber focus ring), full-width
 * amber sign-in. Wrong credentials → danger caption slides down + button
 * shakes. Card rises 24px on mount; fields stagger 60ms.
 */
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { inputCls } from './formUtils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function AuthGate({
  signIn,
}: {
  signIn: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const { t } = useLanguage();
  const [shakeKey, setShakeKey] = useState(0);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await signIn(email, password);
      // onAuthStateChanged swaps this gate for the panel.
    } catch (err) {
      console.warn('[AuthGate] sign-in failed:', err);
      setError(true);
      setShakeKey((k) => k + 1);
      setBusy(false);
    }
  };

  const fieldAnim = (i: number) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.15 + 0.06 * i, duration: 0.4, ease: EASE },
  });

  return (
    <div className="flex min-h-[70dvh] items-center justify-center px-5 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-[400px] rounded-card border border-border bg-surface p-8"
      >
        <motion.div {...fieldAnim(0)} className="flex flex-col items-center text-center">
          <img src="/logo.svg" alt="" className="h-10 w-10" />
          <h1 className="mt-4 font-display text-[32px] font-medium tracking-[-0.01em] text-text">
            {t.admin.authGate.title}
          </h1>
          <p className="mt-2 text-[13px] font-medium leading-[1.5] tracking-[0.01em] text-text-muted">
            {t.admin.authGate.sub}
          </p>
        </motion.div>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
          <motion.div {...fieldAnim(1)}>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder={t.admin.authGate.emailPh}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </motion.div>
          <motion.div {...fieldAnim(2)}>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder={t.admin.authGate.passwordPh}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </motion.div>

          <AnimatePresence initial={false}>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
                className="overflow-hidden text-center text-[13px] font-medium text-danger"
              >
                {t.admin.authGate.error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div {...fieldAnim(3)}>
            <motion.button
              key={shakeKey}
              type="submit"
              disabled={busy}
              animate={shakeKey > 0 ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
              transition={{ duration: 0.25 }}
              className={cn(
                'flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-amber text-[15px]',
                'font-semibold text-[#1A130B] transition-all duration-150 ease-calm',
                'hover:bg-amber-soft active:scale-[0.98] disabled:opacity-70',
              )}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {t.admin.authGate.signingIn}
                </>
              ) : (
                t.admin.authGate.signIn
              )}
            </motion.button>
          </motion.div>
        </form>

        <motion.div {...fieldAnim(4)} className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {t.admin.authGate.back}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
