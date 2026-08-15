/**
 * Home — Memory (final copy pass §4–6). The emotional open after the hero:
 * sensory memory → "We grew up carrying all of it." → "They left home so we
 * could build one. We built it." → "We didn't get here alone." — gratitude,
 * not guilt. Text-only: the words carry it, no imagery.
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
    <section className="mx-auto w-full max-w-container px-5 pb-10 pt-24 md:px-8 md:pb-14 md:pt-32">
      <div className="mx-auto max-w-[640px] text-center">
        {/* §4 — the senses */}
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

        {/* §6 — used once, here */}
        <motion.p
          {...rise(0.08)}
          className="mt-16 text-[16px] leading-[1.65] text-text-muted md:mt-20 md:text-[17px]"
        >
          {m.left}
        </motion.p>
        <motion.p
          {...rise(0.16)}
          className="mt-2 font-display text-2xl font-medium tracking-[-0.01em] text-text md:text-3xl"
        >
          {m.built}
        </motion.p>

        {/* §5 — gratitude, not guilt */}
        <motion.h3
          {...rise(0.08)}
          className="mt-16 font-display text-[26px] font-medium leading-[1.15] tracking-[-0.015em] text-text md:mt-20 md:text-4xl"
        >
          {m.turnTitle}
        </motion.h3>
        <motion.p
          {...rise(0.16)}
          className="mt-4 text-[16px] leading-[1.65] text-text-muted md:text-[17px]"
        >
          {m.turnA}
        </motion.p>
        <motion.p
          {...rise(0.24)}
          className="mt-6 font-display text-xl font-medium tracking-[-0.01em] text-amber md:text-2xl"
        >
          {m.turnB}
        </motion.p>
      </div>
    </section>
  );
}
