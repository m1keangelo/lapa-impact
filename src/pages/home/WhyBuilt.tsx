/**
 * Home — "WHY WE BUILT IT THIS WAY." (final master PART 40–43). The
 * emergency-speed philosophy, told plainly: rolling response with funds
 * that are already available. One peak: "We didn't build LAPA.Help to
 * wait. We built it to respond." Left-aligned — the one editorial break
 * from the centered rhythm (PART 21).
 */
import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function WhyBuilt() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const w = t.home.whyBuilt;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.45, once: true } as const,
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.5,
      ease: EASE,
    },
  });

  return (
    <section className="border-t border-border">
      <div className="mx-auto w-full max-w-container px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-[640px]">
          {/* FINAL TYPOGRAPHY §2/§3 — eyebrow → headline → body rhythm.
              The section label becomes the quiet tracked eyebrow… */}
          <motion.p {...rise(0)} className="eyebrow">
            {w.title}
          </motion.p>

          {/* …and the thesis (§12) becomes the two-level serif headline:
              line 1 smaller/reflective, line 2 lands harder. */}
          <motion.h2
            {...rise(0.06)}
            className="mt-6 font-display leading-[1.12] tracking-[-0.015em] text-text"
          >
            <span
              className="block font-medium"
              style={{ fontSize: 'clamp(24px, 2.8vw, 40px)' }}
            >
              {w.timeMattersA}
            </span>
            <span
              className="mt-1 block font-semibold"
              style={{ fontSize: 'clamp(32px, 4.2vw, 58px)' }}
            >
              {w.timeMattersB}
            </span>
          </motion.h2>

          <motion.p {...rise(0.12)} className="mt-7 text-[17px] leading-[1.65] text-text-muted md:text-[18px]">
            {w.bodyA}
          </motion.p>
          <motion.p {...rise(0.18)} className="mt-4 text-[17px] leading-[1.65] text-text-muted md:text-[18px]">
            {w.bodyB}
          </motion.p>

          {/* The cost thesis as two standalone beats (red-team §05) */}
          <motion.div {...rise(0.2)} className="mt-8 space-y-1">
            <p className="font-sans text-[16px] font-bold uppercase tracking-[0.04em] text-text md:text-[17px]">
              {w.costA}
            </p>
            <p className="font-sans text-[16px] font-bold uppercase tracking-[0.04em] text-text md:text-[17px]">
              {w.costB}
            </p>
          </motion.div>

          {/* PART 42 — why speed matters */}
          <div className="mt-10 space-y-2">
            {w.timeLines.map((line, i) => (
              <motion.p
                key={line}
                {...rise(0.12 + i * 0.05)}
                className="text-[16px] leading-[1.6] text-text-muted md:text-[17px]"
              >
                {line}
              </motion.p>
            ))}
          </div>

          {/* PART 43 — the ESPERAR / RESPONDER contrast, kept extremely
              simple: two words, one quiet, one strong (red-team §05/§10) */}
          <motion.div {...rise(0.06)} className="mt-14">
            <p className="font-sans text-[15px] font-semibold uppercase tracking-[0.14em] text-text-faint">
              {w.waitWord}
            </p>
            <p className="mt-1 font-sans text-[22px] font-bold uppercase tracking-[0.06em] text-text md:text-[24px]">
              {w.respondWord}
            </p>
          </motion.div>

          {/* The differentiation peak (dark ink, not blue: PART 34) —
              two lines: the rejection, then the answer landing harder. */}
          <motion.p
            {...rise(0.08)}
            className="mt-8 font-display leading-[1.18] tracking-[-0.015em]"
            style={{ fontSize: 'clamp(28px, 3.6vw, 50px)' }}
          >
            <span className="block font-medium text-text-muted">{w.peakA}</span>
            <span className="block font-semibold text-text">{w.peakB}</span>
          </motion.p>
          <div className="mt-6 space-y-1.5">
            {w.closer.map((line, i) => (
              <motion.p
                key={line}
                {...rise(0.12 + i * 0.05)}
                className="text-[16px] leading-[1.6] text-text-muted md:text-[17px]"
              >
                {line}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
