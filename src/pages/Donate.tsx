/**
 * Donate page (standalone route — kept for shared links, Stripe return
 * flows and anyone who lands here directly). The decision UI itself is
 * DonateLadder, shared with the one-page homepage.
 */
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { CAMPAIGN, campaignEyebrow } from '@/lib/campaign';
import DonateLadder from '@/components/DonateLadder';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Donate() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLanguage();

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-8 md:pt-14">
      {/* Campaign eyebrow */}
      <m.p
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted"
      >
        LAPA.Help · {campaignEyebrow(lang)}
      </m.p>

      {/* One strong human photograph — static (photographs never animate) */}
      <div className="mt-4 overflow-hidden rounded-card">
        <img
          src={CAMPAIGN.donateImage}
          alt={lang === 'es' ? CAMPAIGN.locationEs : CAMPAIGN.location}
          className="aspect-[16/10] w-full object-cover"
          loading="eager"
        />
      </div>

      {/* Headline + the single decision — static (forms/buttons never animate) */}
      <section className="mt-7">
        <h1 className="text-center font-display text-[32px] font-medium leading-[1.1] tracking-[-0.01em] text-text md:text-[40px]">
          {t.donate.page.title}
        </h1>
        <p className="mt-2 text-center text-[15px] font-medium text-text-muted">
          {t.donate.page.chooseAmount}
        </p>
        <div className="mt-5">
          <DonateLadder />
        </div>
      </section>
    </main>
  );
}
