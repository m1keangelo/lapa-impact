/**
 * Home — Closing (final copy pass §26). The last emotional beat before the
 * final CTA: "We remember where we came from." → "So when our people need
 * us, we show up." → roots / responsibility → signed "LAPA.Help".
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Closing() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const c = t.home.closing;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.45, once: true } as const,
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.55,
      ease: EASE,
    },
  });

  return (
    <section className="mx-auto w-full max-w-container px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[640px] text-center">
        <motion.h2
          {...rise(0)}
          className="font-display text-[30px] font-medium leading-[1.14] tracking-[-0.015em] text-text md:text-5xl"
        >
          {c.remember}
        </motion.h2>

        <motion.p
          {...rise(0.1)}
          className="mt-6 text-[16px] leading-[1.65] text-text-muted md:text-[17px]"
        >
          {c.knowA}
        </motion.p>
        <motion.p
          {...rise(0.18)}
          className="mt-1.5 text-[16px] leading-[1.65] text-text-muted md:text-[17px]"
        >
          {c.knowB}
        </motion.p>

        <motion.p
          {...rise(0.08)}
          className="mt-14 font-display text-[26px] font-medium leading-[1.18] tracking-[-0.015em] text-text md:mt-16 md:text-4xl"
        >
          {c.showUp}
        </motion.p>

        <motion.p
          {...rise(0.08)}
          className="mt-14 text-[16px] leading-[1.65] text-text-muted md:mt-16 md:text-[17px]"
        >
          {c.roots}
        </motion.p>
        <motion.p
          {...rise(0.16)}
          className="mt-1.5 font-display text-2xl font-medium tracking-[-0.01em] text-text md:text-3xl"
        >
          {c.responsibility}
        </motion.p>

        <motion.p
          {...rise(0.2)}
          className="mt-14 text-[12px] font-bold uppercase tracking-[0.22em] text-amber md:mt-16"
        >
          {c.sign}
        </motion.p>
      </div>
    </section>
  );
}
