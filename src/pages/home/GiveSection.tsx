/**
 * One-pager Section 5 — The Ask (id="donar"). The donation ladder lives
 * directly on the homepage: one page, one decision. DonateLadder is the
 * shared decision UI (also used by the standalone /donate route).
 */
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import DonateLadder from '@/components/DonateLadder';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function GiveSection() {
  const reduceMotion = useReducedMotion();
  const { t } = useLanguage();
  const g = t.home.oneGive;

  return (
    <section id="donar" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto w-full max-w-xl px-5">
        <div className="text-center">
          <m.p
            initial={reduceMotion ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.4, once: true }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASE }}
            className="eyebrow flex items-center justify-center gap-3"
          >
            <span className="inline-block h-px w-4 bg-amber" aria-hidden />
            {g.eyebrow}
            <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          </m.p>
          <h2
            className="mt-5 font-display font-medium leading-[1.1] tracking-[-0.015em] text-text"
            style={{ fontSize: 'clamp(32px, 4.2vw, 52px)' }}
          >
            {g.title}
          </h2>
          <p className="mx-auto mt-4 max-w-[48ch] text-[16px] leading-[1.6] text-text-muted md:text-[17px]">
            {g.body}
          </p>
        </div>

        <div className="mt-8">
          <DonateLadder />
        </div>
      </div>
    </section>
  );
}
