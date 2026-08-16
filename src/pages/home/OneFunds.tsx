/**
 * One-pager Section 3 — Where the money goes. Three cards, three photos,
 * three concrete amounts. This is the trust beat right before the ask.
 */
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function OneFunds() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const f = t.home.oneFunds;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.25, once: true } as const,
    transition: { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.5, ease: EASE },
  });

  return (
    <section className="bg-surface py-20 md:py-28">
      <div className="mx-auto w-full max-w-[1080px] px-5">
        <div className="mx-auto max-w-[680px] text-center">
          <m.p {...rise(0)} className="eyebrow flex items-center justify-center gap-3">
            <span className="inline-block h-px w-4 bg-amber" aria-hidden />
            {f.eyebrow}
            <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          </m.p>
          <m.h2
            {...rise(0.08)}
            className="mt-5 font-display font-medium leading-[1.12] tracking-[-0.015em] text-text"
            style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}
          >
            {f.title}
          </m.h2>
          <m.p {...rise(0.16)} className="mt-4 text-[16px] leading-[1.6] text-text-muted md:text-[17px]">
            {f.body}
          </m.p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {f.cards.map((c, i) => (
            <m.article
              key={c.title}
              {...rise(0.1 + i * 0.08)}
              className="overflow-hidden rounded-card border border-border bg-bg"
            >
              <div className="overflow-hidden">
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-[20px] font-semibold text-text">{c.title}</h3>
                <p className="mt-2 text-[15px] leading-[1.55] text-text-muted">
                  <span className="font-semibold text-amber">{c.tag}</span> {c.body}
                </p>
              </div>
            </m.article>
          ))}
        </div>
      </div>
    </section>
  );
}
