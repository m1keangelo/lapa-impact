/**
 * Home Section 1 — Hero (identity typography pass).
 * The hero IS the identity story, told in four art-directed beats over the
 * field photograph — all live HTML/CSS, no graphics:
 *
 *   🇺🇸 SOMOS DE AQUÍ.            (large, clean, flag set into the type)
 *   [flags] NUESTRAS RAÍCES SON DE ALLÁ. [flags]  (constellation, not a string)
 *   NO TENEMOS QUE ELEGIR.        (the emotional centerpiece — biggest)
 *   Y CUANDO LOS NUESTROS NECESITAN AYUDA, ESTAMOS AHÍ.  (the payoff)
 *   + one-line mission, CTAs, numbers-on-tap.
 *
 * Flags are real image elements (public/flags/*.png) — never emoji, which
 * don't render on Windows. Beats animate in with the .hero-seq-* CSS
 * classes (index.css); framer-motion only keeps the parallax + counters.
 */
import { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  animate,
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
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

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* The roots — order is the doc's; row split keeps the constellation
   balanced on desktop and wraps cleanly into 2–4 rows on mobile. */
const FLAGS_A = ['co', 'mx', 'bo', 've', 'pe', 'ec', 'ar', 'cl', 'pr', 'do'];
const FLAGS_B = ['gt', 'sv', 'hn', 'ni', 'cr', 'pa', 'py', 'uy', 'cu', 'br'];
/* Deterministic scale rhythm (small → larger → small), never random. */
const FLAG_SIZES = [20, 26, 32, 26, 20, 20, 26, 32, 26, 20];

function FlagRow({ codes, className }: { codes: string[]; className: string }) {
  return (
    <div
      aria-hidden
      className={`flex flex-wrap items-center justify-center gap-x-3.5 gap-y-3 md:gap-x-5 ${className}`}
    >
      {codes.map((code, i) => (
        <img
          key={code}
          src={`/flags/${code}.png`}
          alt=""
          loading="eager"
          style={{ height: FLAG_SIZES[i % FLAG_SIZES.length] }}
          className="w-auto rounded-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.35)] ring-1 ring-white/20"
        />
      ))}
    </div>
  );
}

/* ---------- counting number ---------- */
function CountUp({
  value,
  format,
  delay = 0,
  className,
}: {
  value: number;
  format: (n: number) => string;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(Math.round(v)));
  const first = useRef(true);

  useEffect(() => {
    if (reduceMotion) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: first.current ? 1.6 : 0.8,
      delay: first.current ? delay : 0,
      ease: EASE,
    });
    first.current = false;
    return () => controls.stop();
  }, [value, delay, reduceMotion, mv]);

  return (
    <motion.span className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {text}
    </motion.span>
  );
}

/* ---------- perpetual scroll cue, isolated + memoized ---------- */
const ScrollCue = memo(function ScrollCue({
  opacity,
  label,
}: {
  opacity: MotionValue<number>;
  label: string;
}) {
  return (
    <motion.div
      style={{ opacity }}
      className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1"
      aria-hidden
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#B0A18C]">
        {label}
      </span>
      <motion.span
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="h-4 w-4 text-[#B0A18C]" />
      </motion.span>
    </motion.div>
  );
});

export default function Hero() {
  const { stats, revision, isDemo } = useGlobalStats();
  const { t, lang } = useLanguage();
  const h = t.home.hero;
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const flash = useAnimationControls();
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

  // Background parallax: 0.4× scroll speed, fading to bg by end of hero.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const bgOpacity = useTransform(scrollYProgress, [0.65, 1], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);

  // Blue radial pulse on the stat group when live totals push an update.
  useEffect(() => {
    if (revision > 0 && !reduceMotion) {
      flash.start({
        boxShadow: [
          '0 0 0px 0px rgba(23,105,255,0)',
          '0 0 90px 24px rgba(23,105,255,0.25)',
          '0 0 0px 0px rgba(23,105,255,0)',
        ],
        transition: { duration: 0.4, ease: 'easeOut' },
      });
    }
  }, [revision, reduceMotion, flash]);

  return (
    <section
      ref={sectionRef}
      className="relative flex items-center justify-center overflow-hidden"
      style={{ minHeight: 'max(100dvh, 640px)' }}
    >
      {/* Background: responsive default photo + admin-managed slideshow
          crossfading on top (4s hold, 1.2s fade). The default stays as the
          base layer so first paint is always instant. */}
      <motion.div style={{ y: bgY, opacity: bgOpacity }} className="absolute inset-0">
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
      </motion.div>

      {/* Scrims: base linear + radial readability gradient centered on the
          type — radial, NOT a rectangular box. */}
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,16,12,0.88),rgba(20,16,12,0.5)_45%,rgba(20,16,12,0.65))]" />
        <div className="absolute inset-0 bg-[radial-gradient(closest-side_at_50%_50%,rgba(0,0,0,0.45),rgba(0,0,0,0.25)_62%,rgba(0,0,0,0))]" />
      </div>

      {/* Content — the four beats, one thought */}
      <div className="relative z-10 mx-auto flex w-full max-w-[900px] flex-col items-center px-5 py-24 text-center">
        {/* 0.1s — live badge */}
        <div className="hero-seq-badge">
          {isDemo ? <PreviewChip /> : <LiveBadge label={t.feed.liveColombia} />}
        </div>

        {/* 0.2s — micro eyebrow */}
        <p className="hero-seq-eyebrow mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/80">
          LAPA.Help · {campaignEyebrow(lang)}
        </p>

        {/* Screen-reader summary of the whole statement */}
        <h1 className="sr-only">
          {h.somosA} {h.somosB} {h.raicesA} {h.raicesB} {h.centerpiece} {h.payoffA}{' '}
          {h.payoffB}
        </h1>

        {/* Beat 1 — 🇺🇸 SOMOS DE AQUÍ. (0.4s) — flag set INTO the type,
            "SOMOS" quieter, "DE AQUÍ." carries the weight */}
        <p
          aria-hidden
          className="hero-seq-somos mt-12 flex flex-wrap items-baseline justify-center gap-x-[0.35em] font-display uppercase leading-[1.1] tracking-[0.02em] text-[#F5F1E8] md:mt-16"
          style={{ fontSize: 'clamp(30px, 6vw, 56px)' }}
        >
          <img
            src="/flags/us.png"
            alt=""
            loading="eager"
            style={{ height: '0.78em' }}
            className="w-auto translate-y-[0.08em] self-center rounded-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.35)] ring-1 ring-white/20"
          />
          <span className="font-medium opacity-90" style={{ fontSize: '0.62em' }}>
            {h.somosA}
          </span>
          <span className="font-bold">{h.somosB}</span>
        </p>

        {/* Beat 2 — the roots: flag constellation surrounding
            NUESTRAS RAÍCES SON DE ALLÁ. (0.9s → 1.4s) */}
        <div
          role="img"
          aria-label={h.flagsAria}
          className="mt-12 flex w-full flex-col items-center gap-6 md:mt-16 md:gap-7"
        >
          <FlagRow codes={FLAGS_A} className="hero-seq-flags-a" />
          <p
            aria-hidden
            className="hero-seq-raices font-display uppercase leading-[1.15] tracking-[0.02em]"
          >
            <span
              className="block font-semibold text-[#F5F1E8]"
              style={{ fontSize: 'clamp(24px, 5vw, 46px)' }}
            >
              {h.raicesA}
            </span>
            <span
              className="mt-1 block font-normal italic text-[#F5F1E8]/75"
              style={{ fontSize: 'clamp(19px, 3.6vw, 34px)' }}
            >
              {h.raicesB}
            </span>
          </p>
          <FlagRow codes={FLAGS_B} className="hero-seq-flags-b" />
        </div>

        {/* Beat 3 — NO TENEMOS QUE ELEGIR. (1.9s) — the centerpiece.
            Nothing decorates it; the type does the work. */}
        <p
          aria-hidden
          className="hero-seq-center mt-16 max-w-[16ch] font-display font-bold uppercase leading-[1.08] tracking-[-0.01em] text-[#F5F1E8] md:mt-24"
          style={{ fontSize: 'clamp(40px, 9.5vw, 88px)' }}
        >
          {h.centerpiece}
        </p>

        {/* Beat 4 — the payoff (2.5s): subordinate, then ESTAMOS AHÍ.
            lands harder and turns LAPA blue. */}
        <p
          aria-hidden
          className="hero-seq-payoff mt-12 font-display uppercase leading-[1.18] tracking-[0.015em] md:mt-16"
        >
          <span
            className="block font-medium text-[#F5F1E8]/90"
            style={{ fontSize: 'clamp(19px, 3.4vw, 32px)' }}
          >
            {h.payoffA}
          </span>
          <span
            className="hero-seq-blue mt-1 block font-bold text-[#F5F1E8]"
            style={{ fontSize: 'clamp(26px, 5vw, 46px)' }}
          >
            {h.payoffB}
          </span>
        </p>

        {/* 3.1s — the one-line mission */}
        <p className="hero-seq-mission mt-10 max-w-[52ch] text-[17px] leading-[1.6] text-[#F5F1E8]/85 md:text-[18px]">
          {h.mission}
        </p>

        {/* 3.4s — CTA row (subordinate to the type) */}
        <div className="hero-seq-cta mt-10 flex flex-col items-center gap-3 sm:flex-row">
          {CHECKOUT_AVAILABLE ? (
            <Link
              to="/donate"
              aria-label={t.donate.giveAria}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#003D7A] px-8 py-4 text-[16px] font-semibold text-[#F5F1E8] transition-all duration-150 ease-calm hover:bg-[#0A4E97] active:scale-[0.98] sm:w-auto"
            >
              <HandCoins className="h-4 w-4" />
              {t.donate.giveNow}
            </Link>
          ) : null}
          <a
            href="#feed-preview"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[4px] border-2 border-[#F5F1E8]/60 px-8 py-4 text-[16px] font-semibold text-[#F5F1E8] transition-all duration-150 ease-calm hover:bg-white/10 active:scale-[0.98] sm:w-auto"
          >
            {h.seeImpact}
          </a>
        </div>

        {/* 3.6s — numbers on tap: transparency one touch away, story leads */}
        <div className="hero-seq-numbers mt-8 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowNumbers((v) => !v)}
            aria-expanded={showNumbers}
            className="text-[13px] font-semibold text-[#B0A18C] underline decoration-dotted underline-offset-4 transition-colors hover:text-[#F5F1E8]"
          >
            {showNumbers ? h.hideNumbers : h.seeNumbers}
          </button>
          <AnimatePresence initial={false}>
            {showNumbers && (
              <motion.div
                key="hero-stats"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
                className="overflow-hidden"
              >
                <motion.div
                  animate={flash}
                  className="mt-5 flex flex-col items-stretch divide-y divide-border rounded-card border border-border bg-bg/40 backdrop-blur-sm md:flex-row md:items-center md:divide-x md:divide-y-0"
                >
                  {[
                    { label: h.givenByDonors, value: stats.totalIn, color: 'var(--amber)', delay: 0.1, money: true },
                    { label: h.sentToField, value: stats.totalOut, color: 'var(--terra)', delay: 0.2, money: true },
                    { label: h.familiesHelped, value: stats.familiesHelped, color: 'var(--sage)', delay: 0.3, money: false },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center px-8 py-4 md:py-5">
                      <CountUp
                        value={s.value}
                        delay={s.delay}
                        format={s.money ? formatMoneyShort : formatCount}
                        className="font-mono text-2xl font-medium leading-none text-[#F5F1E8] md:text-3xl"
                      />
                      <span
                        className="mt-2.5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: s.color }}
                      >
                        {s.label}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ScrollCue opacity={cueOpacity} label={h.scroll} />
    </section>
  );
}
