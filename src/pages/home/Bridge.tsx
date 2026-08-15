/**
 * Home — Community → Action bridge (final master PART 13). Sits
 * immediately before HOW IT WORKS and makes the identity functional:
 * "LAPA.Help is what happens when community becomes action." → where we
 * go → the mission of the moment.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Bridge() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const b = t.home.bridge;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.5, once: true } as const,
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.5,
      ease: EASE,
    },
  });

  return (
    <section className="mx-auto w-full max-w-container px-5 pb-4 pt-8 md:px-8">
      <div className="mx-auto max-w-[640px] text-center">
        <motion.h2
          {...rise(0)}
          className="font-display text-[26px] font-medium leading-[1.2] tracking-[-0.015em] text-text md:text-4xl"
        >
          {b.action}
        </motion.h2>
        <motion.p
          {...rise(0.12)}
          className="mt-4 text-[16px] leading-[1.65] text-text-muted md:text-[17px]"
        >
          {b.goWhere}
        </motion.p>
        <motion.p
          {...rise(0.2)}
          className="mt-5 font-display text-xl font-medium tracking-[-0.01em] text-amber md:text-2xl"
        >
          {b.colombia}
        </motion.p>
      </div>
    </section>
  );
}
