/**
 * Home — CÓMO FUNCIONA / "Tu ayuda tiene un camino." (FINAL IDENTITY +
 * TRUST EXPERIENCE doc). The trust engine: five steps as ONE continuous
 * visual journey — the eye literally follows the money.
 *
 *   01 DAS → 02 EL PAGO SE PROCESA → 03 JUNTAMOS LOS FONDOS →
 *   04 LA AYUDA SALE → 05 LO VES
 *
 * - HUGE chapter numbers (clamp 76→140px), neutral until active, then
 *   LAPA blue — functional, not decorative.
 * - A thin neutral path runs through the numbers — static (TYPOGRAPHIC
 *   MOTION ONLY: no scroll-driven decorative motion).
 * - The current step (viewport center) activates: blue number, slightly
 *   bolder title; passed steps sit a touch quieter.
 * - Each step reveals title → description (~120ms apart) on scroll and
 *   then HOLDS. Numbers render statically. No cards, no carousel.
 * Copy is unchanged — clarity comes from scale + spacing + sequence.
 */
import { useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Path() {
  const { t } = useLanguage();
  const steps = t.home.path.steps;
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.35 } as const,
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.5,
      ease: EASE,
    },
  });

  return (
    <section aria-label={t.home.path.aria} className="py-24 md:py-32">
      <div className="mx-auto w-full max-w-container px-5 md:px-8">
        {/* Header — clear, trustworthy, authoritative; smaller than the
            identity sequence on purpose. */}
        <m.p {...reveal(0)} className="eyebrow flex items-center gap-3">
          <span className="inline-block h-px w-4 bg-amber" aria-hidden />
          {t.home.path.eyebrow}
        </m.p>
        <m.h2
          {...reveal(0.08)}
          className="mt-5 max-w-[18ch] font-sans font-bold leading-[1.1] tracking-[-0.02em] text-text"
          style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}
        >
          {t.home.path.title}
        </m.h2>

        {/* The journey — one path, five stages. */}
        <ol className="relative mt-16 flex flex-col gap-14 md:mt-20 md:gap-20">
          {/* Neutral path running through the number column — static. */}
          <span
            aria-hidden
            className="absolute bottom-0 top-0 w-[2px] -translate-x-1/2 bg-border-strong left-[calc(clamp(96px,13vw,180px)/2)]"
          />

          {steps.map((s, i) => {
            const isActive = i === active;
            const isPassed = i < active;
            const isFinal = i === steps.length - 1;
            return (
              <li
                key={s.title}
                className="relative grid grid-cols-[clamp(96px,13vw,180px)_1fr] items-start gap-5 md:gap-10"
              >
                {/* Active-step sentinel: fires when the step crosses the
                    vertical center of the viewport. */}
                <m.span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-px"
                  viewport={{ margin: '-45% 0px -45% 0px' }}
                  onViewportEnter={() => setActive(i)}
                />

                {/* BIG number — heavy sans with tabular figures, the
                    visual spine (§16–17: ≈3× the step title, never
                    overpowering). Sits ON the path (bg masks the line),
                    neutral until its step is active. Static render —
                    numbers never animate; only the color state changes. */}
                <span
                  aria-hidden
                  className={cn(
                    'relative z-10 -ml-1 bg-bg px-1 text-center font-sans font-bold leading-none tracking-[-0.03em] transition-colors duration-500',
                    isActive ? 'text-[#003D7A]' : 'text-[#D8D2C8]',
                  )}
                  style={{
                    fontSize: 'clamp(64px, 7.5vw, 108px)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Title + description — one reading measure, never a wall */}
                <div
                  className={cn(
                    'max-w-[640px] pt-2 transition-opacity duration-500 md:pt-4',
                    isPassed && 'opacity-75',
                  )}
                >
                  <m.h3
                    {...reveal(0.12)}
                    className={cn(
                      'font-sans font-bold uppercase leading-[1.15] tracking-[0.02em] transition-all duration-500',
                      isFinal
                        ? 'text-[#003D7A]'
                        : isActive
                          ? 'text-text'
                          : 'text-text/85',
                    )}
                    style={{ fontSize: 'clamp(24px, 2.6vw, 36px)' }}
                  >
                    {s.title}
                  </m.h3>
                  <m.p
                    {...reveal(0.22)}
                    className="mt-3 leading-[1.6] text-text-muted"
                    style={{ fontSize: 'clamp(16px, 1.4vw, 18px)' }}
                  >
                    {s.body}
                  </m.p>
                  {/* Step 03 — the trust badge, integrated into the step
                      (a blue-marked line, not a random UI pill). */}
                  {i === 2 ? (
                    <m.p
                      {...reveal(0.3)}
                      className="mt-5 border-l-2 border-[#003D7A] pl-4 text-[13px] font-bold uppercase tracking-[0.14em] text-[#003D7A] md:text-[14px]"
                    >
                      {t.home.path.lessWaste}
                    </m.p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
