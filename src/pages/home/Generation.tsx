/**
 * Home — Generation (final master PART 10/11/106). A separate, later beat:
 * "They left home so we could build one. We built it. Now we remember
 * where we came from." → "We didn't get here alone." → the peak: "Now
 * it's our turn to reach back." — gratitude that leads toward ACTION.
 * Typography carries the emotion; nothing is explained afterward.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Generation() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const g = t.home.generation;

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
          className="font-display text-[28px] font-medium leading-[1.18] tracking-[-0.015em] text-text md:text-4xl"
        >
          {g.left}
        </motion.h2>
        <motion.p
          {...rise(0.12)}
          className="mt-5 font-display text-[22px] font-medium tracking-[-0.01em] text-text md:text-2xl"
        >
          {g.built}
        </motion.p>
        <motion.p
          {...rise(0.2)}
          className="mt-5 text-[16px] leading-[1.65] text-text-muted md:text-[17px]"
        >
          {g.remember}
        </motion.p>

        <motion.p
          {...rise(0.08)}
          className="mt-16 text-[16px] leading-[1.65] text-text-muted md:mt-20 md:text-[17px]"
        >
          {g.notAlone}
        </motion.p>
        <motion.p
          {...rise(0.16)}
          className="mt-1.5 text-[16px] leading-[1.65] text-text-muted md:text-[17px]"
        >
          {g.someoneHelped}
        </motion.p>

        <motion.p
          {...rise(0.24)}
          className="mt-8 font-display text-[26px] font-medium leading-[1.2] tracking-[-0.015em] text-amber md:text-4xl"
        >
          {g.reachBack}
        </motion.p>
      </div>
    </section>
  );
}
