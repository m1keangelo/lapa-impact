/**
 * Home — Intro (master §56). For visitors landing from a shared link:
 * a short, human explanation of LAPA vs LAPA.Help, ending on the mission
 * of the moment — "🇨🇴 Today, Colombia needs us."
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Intro() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.4, once: true } as const,
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.5,
      ease: EASE,
    },
  });

  return (
    <section className="mx-auto w-full max-w-container px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[640px] text-center">
        <motion.p {...rise(0)} className="eyebrow flex items-center justify-center gap-3">
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          {t.home.intro.eyebrow}
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
        </motion.p>
        <motion.h2
          {...rise(0.08)}
          className="mt-4 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.015em] text-text md:text-4xl"
        >
          {t.home.intro.title}
        </motion.h2>
        <motion.p
          {...rise(0.16)}
          className="mt-4 text-[15px] leading-[1.65] text-text-muted"
        >
          {t.home.intro.body}
        </motion.p>
        <motion.p
          {...rise(0.24)}
          className="mt-6 font-display text-xl font-medium tracking-[-0.01em] text-amber md:text-2xl"
        >
          {t.home.intro.colombia}
        </motion.p>
      </div>
    </section>
  );
}
