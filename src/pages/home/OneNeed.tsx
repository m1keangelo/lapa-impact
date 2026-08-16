/**
 * One-pager Section 2 — The Need. Two breaths: what happened, in plain
 * words, with three hard facts. Photographs stay still; type fades up
 * once on scroll (typographic motion only).
 */
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function OneNeed() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const n = t.home.oneNeed;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.3, once: true } as const,
    transition: { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.5, ease: EASE },
  });

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-[720px] px-5 text-center">
        <m.p {...rise(0)} className="eyebrow flex items-center justify-center gap-3">
          <span className="inline-block h-px w-4 bg-terra" aria-hidden />
          {n.eyebrow}
          <span className="inline-block h-px w-4 bg-terra" aria-hidden />
        </m.p>

        <m.h2
          {...rise(0.08)}
          className="mt-5 font-display font-medium leading-[1.12] tracking-[-0.015em] text-text"
          style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}
        >
          {n.title}
        </m.h2>

        <m.p
          {...rise(0.16)}
          className="mx-auto mt-5 max-w-[56ch] text-[16px] leading-[1.65] text-text-muted md:text-[17px]"
        >
          {n.body}
        </m.p>

        <m.div
          {...rise(0.24)}
          className="mx-auto mt-10 grid max-w-[560px] grid-cols-3 divide-x divide-border rounded-card border border-border bg-surface"
        >
          {n.stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center px-3 py-5">
              <span className="font-display text-[22px] font-semibold text-text md:text-[26px]">
                {s.value}
              </span>
              <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted md:text-[11px]">
                {s.label}
              </span>
            </div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
