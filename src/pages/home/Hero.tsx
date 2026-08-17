/**
 * Home Section 1 — Hero (identity typography pass).
 * The hero IS the identity story, told in four art-directed beats over the
 * field photograph — all live HTML/CSS, no graphics:
 *
 *   🇺🇸 SOMOS DE AQUÍ.            (large, clean, flag set into the type)
 *   [flags] NUESTRAS RAÍCES SON DE ALLÁ. [flags]  (constellation, not a string)
 *   …pero…                        (the quiet hinge — small italic serif)
 *   CUANDO LOS NUESTROS NOS NECESITAN, AHÍ ESTAMOS.  (the payoff — L01 summit)
 *   + one-line mission, CTAs, numbers-on-tap.
 *
 * Flags are real image elements (public/flags/*.png) — never emoji, which
 * don't render on Windows. Beats animate in once with the .hero-seq-* CSS
 * classes (index.css) — typography-only motion, then everything stops.
 * The photograph stays still: no parallax, no counters, no loops.
 */
import { memo, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronDown, HandCoins } from 'lucide-react';
import LiveBadge from '@/components/LiveBadge';
import PreviewChip from '@/components/PreviewChip';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useHeroImages } from '@/hooks/useHeroImages';
import { useLanguage } from '@/i18n/LanguageContext';
import { campaignEyebrow } from '@/lib/campaign';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { CHECKOUT_AVAILABLE } from '@/lib/donate';
import { formatCount, formatMoneyShort } from '@/lib/format';

/* The roots — the doc's order, ONE single horizontal line on desktop
   (the flags are the answer to "¿de dónde son nuestras raíces?"), a
   careful centered wrap only when the viewport physically can't fit
   them. Deterministic scale rhythm (small → larger → small), never
   random. */
const FLAGS = [
  'co', 'mx', 'bo', 've', 'pe', 'ec', 'ar', 'cl', 'pr', 'do',
  'gt', 'sv', 'hn', 'ni', 'cr', 'pa', 'py', 'uy', 'cu', 'br',
];
const FLAG_SIZES = [28, 31, 34, 31, 28];

/* ---------- static scroll cue, isolated + memoized ---------- */
const ScrollCue = memo(function ScrollCue({ label }: { label: string }) {
  return (
    <div
      className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
      aria-hidden
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B0A18C]">
        {label}
      </span>
      <ChevronDown className="h-4 w-4 text-[#B0A18C]" />
    </div>
  );
});

export default function Hero() {
  const { stats, isDemo } = useGlobalStats();
  const { t, lang } = useLanguage();
  const h = t.home.hero;
  const reduceMotion = useReducedMotion();
  const [showNumbers, setShowNumbers] = useState(false);

  /* Rotating backgrounds: admin-managed photos (settings/hero) crossfade
     over the bundled default — each holds 4s, then a 1.2s fade. With zero
     or one remote photo (or reduced motion) the hero stays still. */
  const { images: heroImages } = useHeroImages();
  const imagesKey = heroImages.join('|');
  const [slide, setSlide] = useState(0);
  useEffect(() => setSlide(0), [imagesKey]);
  useEffect(() => {
    if (reduceMotion || heroImages.length <= 1) return;
    const id = window.setInterval(
      () => setSlide((s) => (s + 1) % heroImages.length),
      4000,
    );
    return () => window.clearInterval(id);
  }, [heroImages.length, reduceMotion]);
  const activeSlide = heroImages.length > 0 ? slide % heroImages.length : 0;

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: 'max(100dvh, 640px)' }}
    >
      {/* Background: responsive default photo + admin-managed slideshow
          crossfading on top (4s hold, 1.2s fade). The default stays as the
          base layer so first paint is always instant. */}
      <div className="absolute inset-0">
        <picture>
          <source
            type="image/avif"
            srcSet="/hero-390.avif 390w, /hero-768.avif 768w, /hero-1440.avif 1440w, /hero-1920.avif 1920w"
            sizes="100vw"
          />
          <source
            type="image/webp"
            srcSet="/hero-390.webp 390w, /hero-768.webp 768w, /hero-1440.webp 1440w, /hero-1920.webp 1920w"
            sizes="100vw"
          />
          <img
            src="/hero-andes.jpg"
            srcSet="/hero-390.jpg 390w, /hero-768.jpg 768w, /hero-1440.jpg 1440w, /hero-1920.jpg 1920w"
            sizes="100vw"
            alt=""
            width="1920"
            height="1080"
            loading="eager"
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </picture>
        {heroImages.map((src, i) => (
          <img
            key={src}
            src={cloudinaryUrl(src, { width: 1920 })}
            alt=""
            aria-hidden
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
              i === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* Localized tonal protection (TEXT OVER PHOTOGRAPHY rule) — a
          light full-frame exposure grade plus three soft gradients keyed
          to where the type actually sits, darkest directly behind the
          words, dissolving into the photograph. No rectangular box: the
          documentary photo stays visibly present at edges and corners. */}
      <div className="absolute inset-0" aria-hidden>
        {/* base exposure grade — a light cinematic darken so type can sit
            anywhere; the image stays fully visible */}
        <div className="absolute inset-0 bg-[rgba(18,14,11,0.34)]" />
        {/* top band — protects the badge and eyebrow */}
        <div className="absolute inset-x-0 top-0 h-[30%] bg-[linear-gradient(to_bottom,rgba(18,14,11,0.5),rgba(18,14,11,0))]" />
        {/* center column — the type stack; darkest behind the words,
            dissolving into the photograph at the edges */}
        <div className="absolute inset-0 bg-[radial-gradient(72%_68%_at_50%_50%,rgba(14,11,9,0.6),rgba(14,11,9,0.32)_60%,rgba(14,11,9,0)_86%)]" />
        {/* bottom band — behind the payoff, mission line, CTAs and cue */}
        <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(to_top,rgba(18,14,11,0.66),rgba(18,14,11,0.28)_55%,rgba(18,14,11,0))]" />
      </div>

      {/* Content — the five beats, one thought. Wide container so the
          flag line can breathe; text blocks carry their own measures. */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center px-5 py-16 text-center md:py-20">
        {/* live badge — static (not typography); solid backdrop so the
            chip reads over any photograph */}
        <div>
          {isDemo ? (
            <PreviewChip className="border-[#4D8AFF]/70 bg-[#14100C]/90 text-[#4D8AFF]" />
          ) : (
            <LiveBadge label={t.feed.liveColombia} onDark className="border-white/15 bg-[#14100C]/90" />
          )}
        </div>

        {/* 0.2s — micro eyebrow */}
        <p className="hero-seq-eyebrow mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/80">
          LAPA.Help · {campaignEyebrow(lang)}
        </p>

        {/* Screen-reader summary of the whole statement */}
        <h1 className="sr-only">
          {h.somosA} {h.somosB} {h.raicesA} {h.raicesB} {h.pero} {h.payoffA}{' '}
          {h.payoffB}
        </h1>

        {/* Beat 1 — SOMOS DE AQUÍ. 🇺🇸 (0.4s; the flag rides with the
            type as the punctuation at the END of the sentence —
            "SOMOS" quieter, "DE AQUÍ." carries the weight.
            Text-shadow is the last, subtlest layer of tonal protection —
            soft, wide, never visible as an effect. */}
        <p
          aria-hidden
          className="hero-seq-somos mt-10 font-display uppercase leading-[1.08] tracking-[0.02em] text-[#F5F1E8] md:mt-14"
          style={{
            fontSize: 'clamp(40px, 5.9vw, 80px)',
            textShadow: '0 2px 28px rgba(0,0,0,0.38)',
          }}
        >
          <span className="font-medium opacity-90">{h.somosA} </span>
          <span className="font-bold">{h.somosB}</span>
          <img
            src="/flags/us.png"
            alt=""
            loading="eager"
            style={{ height: '0.7em', marginLeft: '0.32em' }}
            className="inline-block w-auto translate-y-[0.06em] rounded-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.4)] ring-1 ring-white/25"
          />
        </p>

        {/* Beat 2 — NUESTRAS RAÍCES / SON DE ALLÁ. (1.2s) — one complete
            declaration, breathing room from beat 1, no flags here. */}
        <p
          aria-hidden
          className="hero-seq-raices mt-12 font-display uppercase leading-[1.12] tracking-[0.02em] md:mt-16"
          style={{ textShadow: '0 2px 28px rgba(0,0,0,0.38)' }}
        >
          <span
            className="block font-semibold text-[#F5F1E8]"
            style={{ fontSize: 'clamp(30px, 5.2vw, 72px)' }}
          >
            {h.raicesA}
          </span>
          <span
            className="mt-1.5 block font-normal italic text-[#F5F1E8]/85"
            style={{ fontSize: 'clamp(26px, 4.6vw, 64px)' }}
          >
            {h.raicesB}
          </span>
        </p>

        {/* Beat 3 — the answer: ALL twenty flags, ONE horizontal line on
            desktop (≥1200px). The row reveals as ONE typographic block
            with the sequence (1.55s) — no per-flag choreography. */}
        <div
          role="img"
          aria-label={h.flagsAria}
          className="hero-seq-flags-row mt-9 flex w-full flex-wrap items-center justify-center gap-x-3.5 gap-y-3.5 md:mt-12 min-[1200px]:flex-nowrap min-[1200px]:gap-x-4"
        >
          {FLAGS.map((code, i) => (
            <img
              key={code}
              src={`/flags/${code}.png`}
              alt=""
              loading="eager"
              style={{ height: FLAG_SIZES[i % FLAG_SIZES.length] }}
              className="w-auto shrink-0 rounded-[2px] shadow-[0_2px_5px_rgba(0,0,0,0.35)] ring-1 ring-white/15"
            />
          ))}
        </div>

        {/* Beat 4 — …pero… (2.9s) — the quiet hinge between roots and
            response. Small italic serif: a pivot, not a statement. */}
        <p
          aria-hidden
          className="hero-seq-word mt-16 font-display font-normal italic leading-[1.1] text-[#F5F1E8]/75 md:mt-20"
          style={{
            fontSize: 'clamp(24px, 3vw, 42px)',
            animationDelay: '2.9s',
            textShadow: '0 1px 18px rgba(0,0,0,0.35)',
          }}
        >
          {h.pero}
        </p>

        {/* Beat 5 — the payoff (3.6s). CUANDO LOS NUESTROS NOS NECESITAN,
            sets it up at medium weight; AHÍ ESTAMOS. is LEVEL 01, the
            typographic summit of the homepage (clamp 64–120px): the
            largest type on the page — nothing else imitates its scale. */}
        <p
          aria-hidden
          className="hero-seq-payoff mt-14 font-display uppercase leading-[1.12] tracking-[0.01em] md:mt-20"
          style={{ textShadow: '0 2px 32px rgba(0,0,0,0.42)' }}
        >
          <span
            className="block font-medium text-[#F5F1E8]/90 [text-wrap:balance]"
            style={{ fontSize: 'clamp(26px, 3.6vw, 52px)' }}
          >
            {h.payoffA}
          </span>
          <span
            className="hero-seq-blue mt-4 block font-bold text-[#F5F1E8] md:mt-6"
            style={{ fontSize: 'clamp(64px, 9vw, 120px)' }}
          >
            {h.payoffB}
          </span>
        </p>

        {/* 3.1s — the one-line mission */}
        <p
          className="hero-seq-mission mt-10 max-w-[52ch] text-[17px] leading-[1.6] text-[#F5F1E8]/85 md:text-[18px]"
          style={{ textShadow: '0 1px 16px rgba(0,0,0,0.4)' }}
        >
          {h.mission}
        </p>

        {/* CTA row — static (buttons never animate), subordinate to the type */}
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          {CHECKOUT_AVAILABLE ? (
            <a
              href="#donar"
              aria-label={t.donate.giveAria}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#003D7A] px-8 py-4 text-[16px] font-bold tracking-[0.01em] text-[#F5F1E8] transition-all duration-150 ease-calm hover:bg-[#0A4E97] active:scale-[0.98] sm:w-auto"
            >
              <HandCoins className="h-4 w-4" />
              {t.donate.giveNow}
            </a>
          ) : null}
          <a
            href="#como-funciona"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[4px] border-2 border-[#F5F1E8]/60 px-8 py-4 text-[16px] font-bold tracking-[0.01em] text-[#F5F1E8] transition-all duration-150 ease-calm hover:bg-white/10 active:scale-[0.98] sm:w-auto"
          >
            {h.seeImpact}
          </a>
        </div>

        {/* numbers on tap — static toggle; transparency one touch away */}
        <div className="mt-8 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowNumbers((v) => !v)}
            aria-expanded={showNumbers}
            className="text-[13px] font-semibold text-[#B0A18C] underline decoration-dotted underline-offset-4 transition-colors hover:text-[#F5F1E8]"
          >
            {showNumbers ? h.hideNumbers : h.seeNumbers}
          </button>
          {showNumbers && (
            <div className="mt-5 flex flex-col items-stretch divide-y divide-white/10 rounded-card border border-white/15 bg-[#14100C]/85 md:flex-row md:items-center md:divide-x md:divide-y-0">
              {[
                { label: h.givenByDonors, value: stats.totalIn, color: 'var(--amber)', money: true },
                { label: h.sentToField, value: stats.totalOut, color: 'var(--terra)', money: true },
                { label: h.familiesHelped, value: stats.familiesHelped, color: 'var(--sage)', money: false },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center px-8 py-4 md:py-5">
                  <span
                    className="font-mono text-2xl font-medium leading-none text-[#F5F1E8] md:text-3xl"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {s.money ? formatMoneyShort(s.value) : formatCount(s.value)}
                  </span>
                  <span
                    className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScrollCue label={h.scroll} />
    </section>
  );
}
