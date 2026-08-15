/**
 * Home — Nostalgia (final master PART 6). Sensory memory fragments, then
 * one peak: "We grew up carrying all of it." Then STOP — no explanation,
 * the visitor fills in their own memory. Text-only.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Memory() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const m = t.home.memory;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.5, once: true } as const,
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.55,
      ease: EASE,
    },
  });

  return (
    <section className="mx-auto w-full max-w-container px-5 py-24 md:px-8 md:py-32">
      <div className="mx-auto max-w-[640px] text-center">
        <div className="space-y-2.5">
          {m.senses.map((line, i) => (
            <motion.p
              key={line}
              {...rise(i * 0.07)}
              className="font-display text-[19px] font-normal italic leading-[1.5] text-text-muted md:text-[22px]"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.h2
          {...rise(0.1)}
          className="mt-10 font-display text-[30px] font-medium leading-[1.12] tracking-[-0.015em] text-text md:text-5xl"
        >
          {m.carried}
        </motion.h2>
      </div>
    </section>
  );
}
