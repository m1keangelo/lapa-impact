/**
 * Home — Intro / Identity (final copy pass §7–9). The identity statement:
 * "Somos de allá. Somos de aquí." (Spanish in both locales — that's the
 * point) → "The borders changed. Our roots didn't." → "Our roots are
 * Latino. Our mission is human." → community becomes action → Colombia.
 * No academic explanation.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Intro() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLanguage();
  const i = t.home.intro;

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
    <section className="mx-auto w-full max-w-container px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-[640px] text-center">
        <motion.p {...rise(0)} className="eyebrow flex items-center justify-center gap-3">
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          {i.eyebrow}
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
        </motion.p>

        {/* §7 — identity, in Spanish in both locales */}
        <div className="mt-8 space-y-1.5">
          {i.mottoEs.map((line, idx) => (
            <motion.p
              key={line}
              {...rise(0.08 + idx * 0.08)}
              className="font-display text-[26px] font-medium leading-[1.25] tracking-[-0.015em] text-text md:text-4xl"
            >
              {line}
            </motion.p>
          ))}
        </div>
        {lang === 'en' ? (
          <motion.p
            {...rise(0.32)}
            className="mt-4 text-[13px] italic leading-[1.6] text-text-muted"
          >
            {i.mottoEn}
          </motion.p>
        ) : null}

        <motion.p
          {...rise(0.08)}
          className="mt-12 text-[16px] leading-[1.65] text-text-muted md:mt-14 md:text-[17px]"
        >
          {i.bordersA}
        </motion.p>
        <motion.p
          {...rise(0.16)}
          className="mt-1.5 font-display text-2xl font-medium tracking-[-0.01em] text-text md:text-3xl"
        >
          {i.bordersB}
        </motion.p>

        {/* §8 */}
        <motion.h2
          {...rise(0.08)}
          className="mt-12 font-display text-[26px] font-medium leading-[1.18] tracking-[-0.015em] text-text md:mt-14 md:text-4xl"
        >
          {i.purpose}
        </motion.h2>

        {/* §9 — community becomes action, ending on the mission of the moment */}
        <motion.p
          {...rise(0.16)}
          className="mt-5 text-[15px] leading-[1.65] text-text-muted"
        >
          {i.action}
        </motion.p>
        <motion.p
          {...rise(0.22)}
          className="mt-2 text-[15px] leading-[1.65] text-text-muted"
        >
          {i.goWhere}
        </motion.p>
        <motion.p
          {...rise(0.28)}
          className="mt-6 font-display text-xl font-medium tracking-[-0.01em] text-amber md:text-2xl"
        >
          {i.colombia}
        </motion.p>
      </div>
    </section>
  );
}
