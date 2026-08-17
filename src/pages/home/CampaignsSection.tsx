/**
 * One-pager Section — mini-campaigns ("Ways you can help right now").
 * DARK beat in the page rhythm: dark = reality / documentary / urgency.
 * Named people, concrete goals, progress bars that spring to life when
 * they enter view. The card CTA scrolls to the single-fund ladder
 * (#donar) and hands it the campaign tag so the gift is attributed —
 * copy makes the pooling explicit (HONESTY rule). Live from Firestore
 * campaigns/; clearly-labeled demo cards in preview mode; the section
 * hides itself entirely when a live site has no campaigns yet.
 */
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { useCampaigns } from '@/hooks/useCampaigns';
import { formatMoney } from '@/lib/format';
import PreviewChip from '@/components/PreviewChip';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Hand the chosen campaign to the donation ladder down-page. */
function aimLadder(campaignId: string) {
  window.dispatchEvent(new CustomEvent('lapa:campaign', { detail: campaignId }));
}

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
    initial: { opacity: 0, y: reduceMotion ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.25, once: true } as const,
    transition: { delay: reduceMotion ? 0 : delay, duration: reduceMotion ? 0 : 0.55, ease: EASE },
  });

  return (
    <section
      className="bg-[#14100C] py-20 md:py-28"
      aria-label={c.title}
    >
      <div className="mx-auto w-full max-w-[1200px] px-5">
        <div className="mx-auto max-w-[680px] text-center">
          {isDemo ? (
            <div className="mb-4 flex justify-center">
              <PreviewChip className="border-[#4D8AFF]/70 bg-[#0C0A08]/90 text-[#4D8AFF]" />
            </div>
          ) : null}
          <m.p {...rise(0)} className="eyebrow flex items-center justify-center gap-3 !text-[#8FBE9F]">
            <span className="inline-block h-px w-4 bg-[#8FBE9F]" aria-hidden />
            {c.eyebrow}
            <span className="inline-block h-px w-4 bg-[#8FBE9F]" aria-hidden />
          </m.p>
          <m.h2
            {...rise(0.08)}
            className="mt-5 font-display font-medium leading-[1.12] tracking-[-0.015em] text-[#F5F1E8]"
            style={{ fontSize: 'clamp(30px, 4vw, 48px)' }}
          >
            {c.title}
          </m.h2>
          <m.p {...rise(0.16)} className="mt-4 text-[16px] leading-[1.6] text-[#F5F1E8]/70 md:text-[17px]">
            {c.body}
          </m.p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {campaigns.map((camp, i) => {
            const pct = Math.min(100, Math.round((camp.raisedCents / camp.goalCents) * 100));
            const done = camp.status === 'completed' || camp.raisedCents >= camp.goalCents;
            return (
              <m.article
                key={camp.id}
                {...rise(0.1 + i * 0.1)}
                className="group flex flex-col overflow-hidden rounded-card border border-white/10 bg-[#1C1712]"
              >
                {camp.imageUrl ? (
                  <div className="relative overflow-hidden">
                    <img
                      src={camp.imageUrl}
                      alt={lang === 'es' ? camp.titleEs : camp.title}
                      loading="lazy"
                      className="aspect-[16/10] w-full object-cover"
                    />
                    {/* tonal protection for the chip; photo stays visible */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-[linear-gradient(to_bottom,rgba(14,11,9,0.55),rgba(14,11,9,0))]" aria-hidden />
                    {done ? (
                      <span className="absolute left-3 top-3 rounded-full bg-sage px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                        {c.completedChip}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-[22px] font-semibold leading-[1.2] text-[#F5F1E8]">
                    {lang === 'es' ? camp.titleEs : camp.title}
                  </h3>
                  <p className="mt-2.5 text-[14px] leading-[1.6] text-[#F5F1E8]/65">
                    {lang === 'es' ? camp.storyEs : camp.story}
                  </p>

                  {/* progress — springs to life on scroll */}
                  <div className="mt-5">
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-white/10"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <m.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ amount: 0.6, once: true }}
                        transition={
                          reduceMotion
                            ? { duration: 0 }
                            : { type: 'spring', stiffness: 50, damping: 20, delay: 0.25 + i * 0.12 }
                        }
                        className="h-full rounded-full bg-[#4D8AFF]"
                      />
                    </div>
                    <p className="mt-2.5 font-mono text-[14px] font-medium text-[#F5F1E8]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(camp.raisedCents)}{' '}
                      <span className="font-sans font-normal text-[#F5F1E8]/55">
                        {c.of} {formatMoney(camp.goalCents)} {c.goal} · {pct}%
                      </span>
                    </p>
                  </div>

                  <div className="mt-5 flex-1" />
                  {done ? (
                    <p className="text-[13px] font-medium leading-[1.5] text-[#8FBE9F]">
                      {c.completedLine}
                    </p>
                  ) : (
                    <a
                      href="#donar"
                      onClick={() => aimLadder(camp.id)}
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] bg-[#003D7A] px-4 py-3 text-[15px] font-bold tracking-[0.01em] text-[#F5F1E8] transition-all duration-150 ease-calm hover:bg-[#0A4E97] active:scale-[0.98]"
                    >
                      {c.giveCta}
                    </a>
                  )}
                </div>
              </m.article>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-[52ch] text-center text-[12px] font-medium leading-[1.6] tracking-[0.01em] text-[#F5F1E8]/45">
          {c.oneFundNote} {c.settlementNote}
        </p>
      </div>
    </section>
  );
}
