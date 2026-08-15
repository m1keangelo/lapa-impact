/**
 * Home — Closing (final master PART 16/104/107). The last emotional beat
 * before the final CTA: "We remember where we came from." → the human
 * invitation ("Our roots are Latino. Our mission is human.") → the
 * signature closing: "Our roots don't stop at a border. Neither does our
 * responsibility." — signed "LAPA.Help". One crescendo, one peak.
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
          className="font-display font-medium leading-[1.14] tracking-[-0.015em] text-text"
          style={{ fontSize: 'clamp(32px, 4.2vw, 56px)' }}
        >
          {c.remember}
        </motion.h2>

        <motion.p
          {...rise(0.1)}
          className="mt-7 text-[17px] leading-[1.65] text-text-muted md:text-[18px]"
        >
          {c.knowA}
        </motion.p>
        <motion.p
          {...rise(0.18)}
          className="mt-2 text-[17px] leading-[1.65] text-text-muted md:text-[18px]"
        >
          {c.knowB}
        </motion.p>

        {/* PART 104 — the human invitation. FINAL TYPOGRAPHY §21: the
            last sentence of a book — editorial serif, tight leading,
            weight contrast inside each sentence, massive whitespace.
            Clearly quieter than the hero summit (ESTAMOS AHÍ). */}
        <motion.p
          {...rise(0.08)}
          className="mx-auto mt-24 max-w-[16ch] font-display leading-[1.08] tracking-[-0.015em] text-text md:mt-32"
          style={{ fontSize: 'clamp(42px, 6vw, 88px)' }}
        >
          <span className="block">
            <span className="font-normal">{c.purposeA1}</span>
            <span className="font-semibold">{c.purposeA2}</span>
          </span>
          <span className="mt-2 block">
            <span className="font-normal">{c.purposeB1}</span>
            <span className="font-semibold">{c.purposeB2}</span>
          </span>
        </motion.p>

        {/* PART 16 — the signature closing moment */}
        <motion.p
          {...rise(0.08)}
          className="mt-24 text-[17px] leading-[1.65] text-text-muted md:mt-32 md:text-[18px]"
        >
          {c.roots}
        </motion.p>
        <motion.p
          {...rise(0.16)}
          className="mt-2 font-display font-medium leading-[1.18] tracking-[-0.015em] text-text"
          style={{ fontSize: 'clamp(28px, 3.8vw, 52px)' }}
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
