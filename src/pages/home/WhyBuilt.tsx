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
          <motion.h2
            {...rise(0)}
            className="font-display text-[28px] font-medium leading-[1.15] tracking-[-0.015em] text-text md:text-4xl"
          >
            {w.title}
          </motion.h2>

          <motion.p {...rise(0.08)} className="mt-5 text-[16px] leading-[1.65] text-text-muted">
            {w.bodyA}
          </motion.p>
          <motion.p {...rise(0.14)} className="mt-3 text-[16px] leading-[1.65] text-text-muted">
            {w.bodyB}
          </motion.p>

          {/* PART 42 — why speed matters */}
          <motion.p
            {...rise(0.08)}
            className="mt-12 font-display text-xl font-medium tracking-[-0.01em] text-text md:text-2xl"
          >
            {w.timeMatters}
          </motion.p>
          <div className="mt-4 space-y-1.5">
            {w.timeLines.map((line, i) => (
              <motion.p
                key={line}
                {...rise(0.12 + i * 0.05)}
                className="text-[15px] leading-[1.6] text-text-muted"
              >
                {line}
              </motion.p>
            ))}
          </div>

          {/* PART 43 — the differentiation peak (dark ink, not blue: PART 34) */}
          <motion.p
            {...rise(0.08)}
            className="mt-12 font-display text-[26px] font-medium leading-[1.18] tracking-[-0.015em] text-text md:text-4xl"
          >
            {w.peak}
          </motion.p>
          <div className="mt-5 space-y-1">
            {w.closer.map((line, i) => (
              <motion.p
                key={line}
                {...rise(0.12 + i * 0.05)}
                className="text-[15px] leading-[1.6] text-text-muted"
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
