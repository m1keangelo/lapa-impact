/**
 * Home Section 1 — Hero (home.md §Section 1).
 * Full-viewport: /hero-andes.jpg with layered scrim + radial amber glow,
 * word-staggered Fraunces headline, three live counting stats, CTA row and
 * a scroll cue. Entrance + counters use Framer Motion; the background
 * parallax is FM scroll-linked (GSAP is isolated to the Journey section).
 */
import { memo, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import {
  animate,
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
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useLanguage } from '@/i18n/LanguageContext';
import { STRIPE_PAYMENT_LINK } from '@/lib/donate';
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
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        {label}
      </span>
      <motion.span
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="h-4 w-4 text-text-muted" />
      </motion.span>
    </motion.div>
  );
});

export default function Hero() {
  const { stats, revision } = useGlobalStats();
  const { t } = useLanguage();
  const HEADLINE = t.home.hero.headline;
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const flash = useAnimationControls();

  // Background parallax: 0.4× scroll speed, fading to bg by end of hero.
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const bgOpacity = useTransform(scrollYProgress, [0.65, 1], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.04], [1, 0]);

  // Amber radial pulse on the stat group when live totals push an update.
  useEffect(() => {
    if (revision > 0 && !reduceMotion) {
      flash.start({
        boxShadow: [
          '0 0 0px 0px rgba(232,163,61,0)',
          '0 0 90px 24px rgba(232,163,61,0.22)',
          '0 0 0px 0px rgba(232,163,61,0)',
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
      {/* Background + scrims */}
      <motion.div style={{ y: bgY, opacity: bgOpacity }} className="absolute inset-0">
        <img
          src="/hero-andes.jpg"
          alt=""
          className="h-full w-full object-cover"
          fetchPriority="high"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute inset-0"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,16,12,0.92),rgba(20,16,12,0.55)_50%,rgba(20,16,12,0.7))]" />
        <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_50%_58%,rgba(232,163,61,0.2),transparent_70%)]" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[760px] flex-col items-center px-5 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE }}
        >
          <LiveBadge label={t.home.hero.liveBadge} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.15, duration: 0.5 }}
          className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F3EAD9]"
        >
          — LAPA Mission Colombia
        </motion.p>

        <h1 className="mt-4 font-display text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-[#F3EAD9] md:text-[72px]">
          {HEADLINE.map((w, i) => (
            <motion.span
              key={i}
              className={
                w.accent ? 'inline-block italic text-amber' : 'inline-block'
              }
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 0.2 + i * 0.07,
                duration: reduceMotion ? 0 : 0.6,
                ease: EASE,
              }}
            >
              {w.word}
              {i < HEADLINE.length - 1 ? ' ' : ''}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduceMotion ? 0 : 0.9,
            duration: reduceMotion ? 0 : 0.5,
            ease: EASE,
          }}
          className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] text-[#B0A18C] md:text-[18px]"
        >
          {t.home.hero.sub}
        </motion.p>

        {/* Live stat cluster */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduceMotion ? 0 : 1.1,
            duration: reduceMotion ? 0 : 0.5,
            ease: EASE,
          }}
          className="mt-10"
        >
          <motion.div
            animate={flash}
            className="flex flex-col items-stretch divide-y divide-border rounded-card border border-border bg-bg/40 backdrop-blur-sm md:flex-row md:items-center md:divide-x md:divide-y-0"
          >
          {[
            { label: t.home.hero.givenByDonors, value: stats.totalIn, color: 'var(--amber)', delay: 1.2, money: true },
            { label: t.home.hero.sentToField, value: stats.totalOut, color: 'var(--terra)', delay: 1.35, money: true },
            { label: t.home.hero.familiesHelped, value: stats.familiesHelped, color: 'var(--sage)', delay: 1.5, money: false },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center px-8 py-5 md:py-6">
              <CountUp
                value={s.value}
                delay={s.delay}
                format={s.money ? formatMoneyShort : formatCount}
                className="font-mono text-4xl font-medium leading-none text-[#F3EAD9] md:text-6xl"
              />
              <span
                className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: s.color }}
              >
                {s.label}
              </span>
            </div>
          ))}
          </motion.div>
        </motion.div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduceMotion ? 0 : 1.6,
            duration: reduceMotion ? 0 : 0.45,
            ease: EASE,
          }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          {STRIPE_PAYMENT_LINK ? (
            <a
              href={STRIPE_PAYMENT_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.donate.giveAria}
              className="inline-flex items-center gap-2 rounded-[10px] bg-amber px-6 py-3.5 text-[15px] font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
            >
              <HandCoins className="h-4 w-4" />
              {t.donate.giveNow}
            </a>
          ) : null}
          <Link
            to="/login"
            className={
              STRIPE_PAYMENT_LINK
                ? 'rounded-[10px] border border-border-strong px-6 py-3.5 text-[15px] font-semibold text-[#F3EAD9] transition-all duration-150 ease-calm hover:bg-surface-2/60 active:scale-[0.98]'
                : 'rounded-[10px] bg-amber px-6 py-3.5 text-[15px] font-semibold text-[#1A130B] transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]'
            }
          >
            {t.home.hero.enterCode}
          </Link>
          <a
            href="#feed-preview"
            className="rounded-[10px] border border-border-strong px-6 py-3.5 text-[15px] font-semibold text-[#F3EAD9] transition-all duration-150 ease-calm hover:bg-surface-2/60 active:scale-[0.98]"
          >
            {t.home.hero.watchFeed}
          </a>
        </motion.div>
      </div>

      <ScrollCue opacity={cueOpacity} label={t.home.hero.scroll} />
    </section>
  );
}
