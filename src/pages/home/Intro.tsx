/**
 * Home — Who We Are (final master PART 4/19/105). SHORT on purpose:
 * the identity centerpiece — "Somos de allá. Somos de aquí. Y, de alguna
 * manera, somos de los dos." (Spanish in both locales, one of the
 * strongest typographic moments on the site) → "The borders changed.
 * Our roots didn't." → "We grew up among many roots." Then STOP.
 * Large whitespace, editorial spread, no explanation.
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
    <section className="mx-auto w-full max-w-container px-5 py-24 md:px-8 md:py-36">
      <div className="mx-auto max-w-[720px] text-center">
        <motion.p {...rise(0)} className="eyebrow flex items-center justify-center gap-3">
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          {i.eyebrow}
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
        </motion.p>

        {/* PART 4 — the identity centerpiece. Do not dilute it. */}
        <div className="mt-10 space-y-2 md:mt-14">
          {i.mottoEs.map((line, idx) => (
            <motion.p
              key={line}
              {...rise(0.1 + idx * 0.1)}
              className="font-display text-[32px] font-medium leading-[1.18] tracking-[-0.02em] text-text md:text-[54px]"
            >
              {line}
            </motion.p>
          ))}
        </div>
        {lang === 'en' ? (
          <motion.p
            {...rise(0.4)}
            className="mx-auto mt-6 max-w-[46ch] text-[14px] italic leading-[1.6] text-text-muted"
          >
            {i.mottoEn}
          </motion.p>
        ) : null}

        {/* PART 8 — strong but QUIETER, beneath the centerpiece */}
        <motion.p
          {...rise(0.1)}
          className="mt-16 text-[16px] leading-[1.65] text-text-muted md:mt-20 md:text-[17px]"
        >
          {i.bordersA}
        </motion.p>
        <motion.p
          {...rise(0.18)}
          className="mt-1.5 font-display text-2xl font-medium tracking-[-0.01em] text-text md:text-3xl"
        >
          {i.bordersB}
        </motion.p>

        {/* PART 5/9 — then stop. */}
        <motion.p
          {...rise(0.26)}
          className="mt-10 font-display text-[19px] font-normal italic leading-[1.5] text-text-muted md:text-[21px]"
        >
          {i.manyRoots}
        </motion.p>
      </div>
    </section>
  );
}
