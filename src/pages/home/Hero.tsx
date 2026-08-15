/**
 * Home Section 1 — Hero (FIN spec §1/§2/§3/§4/§9/§13).
 * Full-viewport responsive hero image (AVIF/WebP/JPG srcset) with a radial
 * readability gradient centered on the headline, the animated tagline
 * "De aquí. De allá. Juntos.", a two-tone clamp-sized headline
 * (ivory → LAPA blue), and subordinate CTAs. The intro sequence is pure
 * CSS (see .hero-seq-* in index.css) with exact beat timings; framer-motion
 * only keeps the background parallax and the live-numbers toggle.
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
import { useLanguage } from '@/i18n/LanguageContext';
import { campaignEyebrow } from '@/lib/campaign';
import { CHECKOUT_AVAILABLE } from '@/lib/donate';
import { formatCount, formatMoneyShort } from '@/lib/format';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

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
      {/* Background: responsive image (FIN §10/§12) + parallax */}
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
      </motion.div>

      {/* Scrims: base linear + radial readability gradient centered on the
          headline (FIN §4) — radial, NOT a rectangular box. */}
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,16,12,0.88),rgba(20,16,12,0.45)_50%,rgba(20,16,12,0.6))]" />
        <div className="absolute inset-0 bg-[radial-gradient(closest-side_at_50%_52%,rgba(0,0,0,0.45),rgba(0,0,0,0.25)_62%,rgba(0,0,0,0))]" />
      </div>

      {/* Content — CSS intro sequence (FIN §2/§13) */}
      <div className="relative z-10 mx-auto flex w-full max-w-[820px] flex-col items-center px-5 py-24 text-center">
        {/* 0.1s — live badge */}
        <div className="hero-seq-badge">
          {isDemo ? <PreviewChip /> : <LiveBadge label={t.feed.liveColombia} />}
        </div>

        {/* 0.2s — micro eyebrow */}
        <p className="hero-seq-eyebrow mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F5F1E8]/80">
          LAPA.Help · {campaignEyebrow(lang)}
        </p>

        {/* 0.4s / 0.7s / 1.0s — the animated tagline (FIN §2) */}
        <p
          className="mt-8 text-[24px] font-medium uppercase tracking-[0.15em] text-[#F5F1E8] md:text-[32px]"
          aria-label={`${h.tag1} ${h.tag2} ${h.tag3}`}
        >
          <span aria-hidden className="hero-seq-tag1 inline-block">{h.tag1}</span>{' '}
          <span aria-hidden className="hero-seq-tag2 inline-block">{h.tag2}</span>{' '}
          <span aria-hidden className="hero-seq-tag3 inline-block">{h.tag3}</span>
        </p>

        {/* 1.2s — main headline (FIN §1 sizing, §3 color split) */}
        <h1
          className="hero-seq-headline mt-5 font-display font-bold leading-[1.1] tracking-[-0.02em]"
          style={{ fontSize: 'clamp(40px, 10vw, 88px)' }}
        >
          <span className="block text-[#F5F1E8]">{h.headlineA}</span>
          {/* LAPA blue accent — a lighter tint of #003D7A so the blue stays
              VISUALLY OBVIOUS on the dark photo (navy on black would vanish). */}
          <span className="block text-[#4D8AFF]">{h.headlineB}</span>
        </h1>

        {/* 1.6s — supporting text */}
        <p className="hero-seq-support mt-6 max-w-[52ch] text-[17px] leading-[1.6] md:text-[18px]">
          <span className="block font-medium text-[#F5F1E8]">{h.sub}</span>
          <span className="mt-1.5 block text-[#B0A18C]">{h.subB}</span>
        </p>

        {/* 1.8s — CTA row (FIN §9: subordinate to the headline) */}
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

        {/* 2.0s — numbers on tap: transparency one touch away, story leads */}
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
