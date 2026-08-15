/**
 * Home — Quiénes Somos (FIN spec §5/§6). ONE powerful pause, not three
 * pages of poetry: the old memory/generation/bridge copy is gone; what
 * remains is the identity statement and three quiet supporting lines.
 * Ivory card, centered, generous air — then the page moves on.
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function WhoWeAre() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const w = t.home.who;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.4, once: true } as const,
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.55,
      ease: EASE,
    },
  });

  return (
    <section className="mb-[120px] bg-[#F9F7F4] px-10 py-20">
      <div className="mx-auto max-w-[800px] text-center">
        <motion.p
          {...rise(0)}
          className="flex items-center justify-center gap-3 text-[12px] font-bold uppercase tracking-[0.14em] text-text-muted"
        >
          <span className="inline-block h-px w-4 bg-[#003D7A]" aria-hidden />
          {w.eyebrow}
          <span className="inline-block h-px w-4 bg-[#003D7A]" aria-hidden />
        </motion.p>

        {/* The identity statement — LEVEL 02 primary emotional lines,
            final line one step down with "de los dos." punctuated in
            LAPA blue (FIN §5). */}
        <div className="mt-12 md:mt-14">
          <motion.p
            {...rise(0.1)}
            className="font-display font-medium leading-[1.18] tracking-[-0.015em] text-[#2C2C2C]"
            style={{ fontSize: 'clamp(38px, 5vw, 72px)' }}
          >
            {w.line1}
          </motion.p>
          <motion.p
            {...rise(0.2)}
            className="font-display font-medium leading-[1.18] tracking-[-0.015em] text-[#2C2C2C]"
            style={{ fontSize: 'clamp(38px, 5vw, 72px)' }}
          >
            {w.line2}
          </motion.p>
          <motion.p
            {...rise(0.3)}
            className="mt-4 font-display font-medium leading-[1.2] tracking-[-0.015em] text-[#2C2C2C]"
            style={{ fontSize: 'clamp(28px, 3.6vw, 52px)' }}
          >
            {w.line3A}
            <span className="text-[#003D7A]">{w.line3B}</span>
          </motion.p>
        </div>

        <motion.div
          {...rise(0.4)}
          className="mx-auto mt-10 max-w-[52ch] space-y-1.5 text-[18px] leading-[1.6] text-[#555555]"
        >
          {w.support.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
