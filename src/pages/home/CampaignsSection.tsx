/**
 * One-pager Section — mini-campaigns ("Ways you can help right now").
 * Named people, concrete goals, live progress bars. The card CTA scrolls
 * to the single-fund ladder (#donar) — copy makes the pooling explicit
 * (HONESTY rule: no per-campaign fake checkout). Live from Firestore
 * campaigns/; clearly-labeled demo cards in preview mode; the whole
 * section hides itself when a live site simply has no campaigns yet.
 */
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatMoney } from '@/lib/format';
import PreviewChip from '@/components/PreviewChip';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function CampaignsSection() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLanguage();
  const { campaigns, status, isDemo } = useCampaigns();
  const c = t.home.campaigns;

  // Honest absence: a live site with zero campaigns shows nothing at all.
  if (!isDemo && (status === 'loading' || status === 'error' || campaigns.length === 0)) {
    return null;
  }

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.25, once: true } as const,
    transition: { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.5, ease: EASE },
  });

  return (
    <section className="py-20 md:py-28" aria-label={c.title}>
      <div className="mx-auto w-full max-w-[1080px] px-5">
        <div className="mx-auto max-w-[680px] text-center">
          {isDemo ? (
            <div className="mb-4 flex justify-center">
              <PreviewChip />
            </div>
          ) : null}
          <m.p {...rise(0)} className="eyebrow flex items-center justify-center gap-3">
            <span className="inline-block h-px w-4 bg-amber" aria-hidden />
            {c.eyebrow}
            <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          </m.p>
          <m.h2
            {...rise(0.08)}
            className="mt-5 font-display font-medium leading-[1.12] tracking-[-0.015em] text-text"
            style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}
          >
            {c.title}
          </m.h2>
          <m.p {...rise(0.16)} className="mt-4 text-[16px] leading-[1.6] text-text-muted md:text-[17px]">
            {c.body}
          </m.p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {campaigns.map((camp, i) => {
            const pct = Math.min(100, Math.round((camp.raisedCents / camp.goalCents) * 100));
            const done = camp.status === 'completed' || camp.raisedCents >= camp.goalCents;
            return (
              <m.article
                key={camp.id}
                {...rise(0.1 + i * 0.08)}
                className="flex flex-col overflow-hidden rounded-card border border-border bg-surface"
              >
                {camp.imageUrl ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={camp.imageUrl}
                      alt={lang === 'es' ? camp.titleEs : camp.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover"
                    />
                    {done ? (
                      <span className="absolute left-3 top-3 rounded-full bg-sage px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                        {c.completedChip}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-[20px] font-semibold leading-[1.2] text-text">
                    {lang === 'es' ? camp.titleEs : camp.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-[1.55] text-text-muted">
                    {lang === 'es' ? camp.storyEs : camp.story}
                  </p>

                  {/* progress */}
                  <div className="mt-4">
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-amber transition-[width] duration-700 ease-calm"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-2 text-[13px] font-semibold text-text">
                      {formatMoney(camp.raisedCents)}{' '}
                      <span className="font-normal text-text-muted">
                        {c.of} {formatMoney(camp.goalCents)} {c.goal} · {pct}%
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex-1" />
                  {done ? (
                    <p className="text-[13px] font-medium leading-[1.5] text-sage">
                      {c.completedLine}
                    </p>
                  ) : (
                    <a
                      href="#donar"
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] border-2 border-amber px-4 py-2.5 text-[14px] font-semibold text-amber transition-all duration-150 ease-calm hover:bg-amber hover:text-white active:scale-[0.98]"
                    >
                      {c.giveCta}
                    </a>
                  )}
                </div>
              </m.article>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[12px] font-medium tracking-[0.01em] text-text-faint">
          {c.oneFundNote}
        </p>
      </div>
    </section>
  );
}
