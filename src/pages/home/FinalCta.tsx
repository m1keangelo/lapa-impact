/**
 * Home Section 7 — Final CTA (home.md §Section 7).
 * Inline mini CodeInput (6+6 segmented mono boxes) with a single amber
 * arrow button; validates a 6-digit donor code, stores it in
 * sessionStorage and routes to /impact. Boxes pulse amber sequentially
 * (left→right) when scrolled into view.
 */
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, HandCoins, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { STRIPE_PAYMENT_LINK } from '@/lib/donate';
import {
  DONOR_CODE_LENGTH,
  isPlausibleDonorCode,
  setDonorCode,
} from '@/lib/session';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const DIGIT = /^[0-9]$/;

export default function FinalCta() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [chars, setChars] = useState<string[]>(Array(DONOR_CODE_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { amount: 0.3, once: true });

  const code = chars.join('');
  const complete = isPlausibleDonorCode(code);

  const setChar = (i: number, ch: string) => {
    setChars((prev) => {
      const next = [...prev];
      next[i] = ch;
      return next;
    });
  };

  const handleChange = (i: number, raw: string) => {
    const cleaned = raw.trim();
    if (cleaned.length > 1) {
      // Pasted multiple characters — distribute across boxes.
      const valid = cleaned.split('').filter((c) => DIGIT.test(c)).slice(0, DONOR_CODE_LENGTH);
      if (valid.length === 0) return;
      setChars((prev) => {
        const next = [...prev];
        valid.forEach((c, j) => {
          if (i + j < DONOR_CODE_LENGTH) next[i + j] = c;
        });
        return next;
      });
      const focusTo = Math.min(i + valid.length, DONOR_CODE_LENGTH - 1);
      inputsRef.current[focusTo]?.focus();
      return;
    }
    if (!DIGIT.test(cleaned)) return;
    setChar(i, cleaned);
    if (i < DONOR_CODE_LENGTH - 1) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[i]) {
        setChar(i, '');
      } else if (i > 0) {
        setChar(i - 1, '');
        inputsRef.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < DONOR_CODE_LENGTH - 1) {
      inputsRef.current[i + 1]?.focus();
    } else if (e.key === 'Enter' && complete) {
      submit();
    }
  };

  const submit = () => {
    if (!complete || submitting) return;
    setSubmitting(true);
    // Brief morph-to-spinner beat, then route (home.md §Section 7).
    window.setTimeout(() => {
      setDonorCode(code);
      navigate('/impact');
    }, 400);
  };

  const stagger = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.3, once: true } as const,
    transition: { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.5, ease: EASE },
  });

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* subtle radial amber glow */}
      <div
        className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_60%,rgba(232,163,61,0.12),transparent_70%)]"
        aria-hidden
      />
      <div
        ref={containerRef}
        className="relative mx-auto flex max-w-[680px] flex-col items-center px-5 text-center"
      >
        <motion.p {...stagger(0)} className="eyebrow flex items-center gap-3">
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          {t.home.finalCta.eyebrow}
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
        </motion.p>

        <motion.h2
          {...stagger(0.1)}
          className="mt-4 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl"
        >
          {t.home.finalCta.title}
        </motion.h2>

        <motion.p
          {...stagger(0.2)}
          className="mt-3 text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted"
        >
          {t.home.finalCta.body}
        </motion.p>

        {/* Segmented code boxes + arrow button */}
        <motion.div {...stagger(0.3)} className="mt-8 flex items-center gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2" role="group" aria-label={t.home.finalCta.groupAria}>
            {chars.map((ch, i) => (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                {i === 6 ? <span className="mx-0.5 h-px w-3 bg-border-strong" aria-hidden /> : null}
                <motion.div
                  animate={
                    inView && !reduceMotion
                      ? {
                          borderColor: [
                            'var(--border)',
                            'var(--amber)',
                            'var(--border)',
                          ],
                        }
                      : undefined
                  }
                  transition={{
                    delay: 0.4 + i * 0.06,
                    duration: 0.6,
                    ease: 'easeInOut',
                  }}
                  className={cn(
                    'rounded-[10px] border bg-surface-2 transition-colors focus-within:border-amber',
                    ch ? 'border-border-strong' : 'border-border',
                  )}
                >
                  <input
                    ref={(el) => {
                      inputsRef.current[i] = el;
                    }}
                    value={ch}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    inputMode="numeric"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={DONOR_CODE_LENGTH}
                    aria-label={t.home.finalCta.charAria(i)}
                    className="h-11 w-7 bg-transparent text-center font-mono text-lg tracking-[0.08em] text-text caret-amber outline-none sm:h-12 sm:w-9"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                </motion.div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!complete || submitting}
            aria-label={t.home.finalCta.submitAria}
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] transition-all duration-150 ease-calm active:scale-[0.98]',
              complete
                ? 'bg-amber text-[#1A130B] hover:bg-amber-soft'
                : 'cursor-not-allowed bg-surface-2 text-text-faint',
            )}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </button>
        </motion.div>

        <motion.div {...stagger(0.4)} className="mt-6 flex flex-col items-center gap-4">
          {STRIPE_PAYMENT_LINK ? (
            <a
              href={STRIPE_PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.donate.giveAria}
              className="inline-flex items-center gap-2 rounded-[10px] bg-amber px-6 py-3.5 text-[15px] font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
            >
              <HandCoins className="h-4 w-4" />
              {t.donate.giveNow}
            </a>
          ) : null}
          {STRIPE_PAYMENT_LINK ? (
            <p className="max-w-[46ch] text-[12px] font-medium leading-[1.45] tracking-[0.01em] text-text-faint">
              {t.donate.potNote}
            </p>
          ) : null}
          <Link
            to="/feed"
            className="text-sm font-semibold text-amber transition-colors hover:text-amber-soft"
          >
            {t.home.finalCta.noCode}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
