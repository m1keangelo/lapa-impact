/**
 * Home Section 7 — Final CTA (master §35–37). The 6-digit code is gone from
 * the public experience: this closing beat invites the donor into MY IMPACT
 * (email + password account) and everyone else into the give/feed loop.
 */
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, HandCoins } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { CHECKOUT_AVAILABLE } from '@/lib/donate';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function FinalCta() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();

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
        className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_60%,rgba(23,105,255,0.07),transparent_70%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-[680px] flex-col items-center px-5 text-center">
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
          className="mt-3 max-w-[50ch] text-[14px] font-medium leading-[1.55] tracking-[0.01em] text-text-muted"
        >
          {t.home.finalCta.body}
        </motion.p>

        <motion.div {...stagger(0.3)} className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            to="/impact"
            className="inline-flex items-center gap-2 rounded-[10px] bg-amber px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
          >
            {t.home.finalCta.myImpactCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {CHECKOUT_AVAILABLE ? (
            <Link
              to="/donate"
              aria-label={t.donate.giveAria}
              className="inline-flex items-center gap-2 rounded-[10px] border border-border-strong px-6 py-3.5 text-[15px] font-semibold text-text transition-all duration-150 ease-calm hover:bg-surface-2/60 active:scale-[0.98]"
            >
              <HandCoins className="h-4 w-4" />
              {t.donate.giveNow}
            </Link>
          ) : null}
        </motion.div>

        <motion.div {...stagger(0.4)} className="mt-6 flex flex-col items-center gap-4">
          {CHECKOUT_AVAILABLE ? (
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
