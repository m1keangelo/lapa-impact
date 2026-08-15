/**
 * Home Section 1 — Hero (home.md §Section 1).
 * Full-viewport: /hero-andes.jpg with layered scrim + radial amber glow,
 * word-staggered Fraunces headline, CTA row, live counting stats tucked
 * behind a "see the numbers" toggle, and a scroll cue. The background
 * parallax is FM scroll-linked (no GSAP — the pinned journey was removed in the final pass).
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
  const HEADLINE = t.home.hero.headline;
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

  // Amber radial pulse on the stat group when live totals push an update.
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
        <div className="absolute inset-0 bg-[radial-gradient(700px_circle_at_50%_58%,rgba(23,105,255,0.18),transparent_70%)]" />
      </motion.div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[760px] flex-col items-center px-5 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: EASE }}
        >
          {isDemo ? <PreviewChip /> : <LiveBadge label={t.feed.liveColombia} />}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.15, duration: 0.5 }}
          className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F3EAD9]"
        >
          LAPA.Help · {campaignEyebrow(lang)}
        </motion.p>

        <h1 className="mt-4 font-display text-[36px] font-medium leading-[1.08] tracking-[-0.02em] text-[#F3EAD9] md:text-[64px]">
          {HEADLINE.map((w, i) => (
            <span key={i}>
              {w.br ? <br aria-hidden /> : null}
              <motion.span
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
                {i < HEADLINE.length - 1 && !HEADLINE[i + 1].br ? ' ' : ''}
              </motion.span>
            </span>
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
          className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] md:text-[18px]"
        >
          <span className="block font-medium text-[#F3EAD9]">{t.home.hero.sub}</span>
          <span className="mt-1.5 block text-[#B0A18C]">{t.home.hero.subB}</span>
        </motion.p>

        {/* CTA row — action before accounting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reduceMotion ? 0 : 1.1,
            duration: reduceMotion ? 0 : 0.45,
            ease: EASE,
          }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          {CHECKOUT_AVAILABLE ? (
            <Link
              to="/donate"
              aria-label={t.donate.giveAria}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-amber px-6 py-4 text-[16px] font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98] sm:w-auto"
            >
              <HandCoins className="h-4 w-4" />
              {t.donate.giveNow}
            </Link>
          ) : null}
          <a
            href="#feed-preview"
            className="inline-flex w-full items-center justify-center rounded-[10px] border border-white/25 px-6 py-4 text-[16px] font-semibold text-[#F3EAD9] transition-all duration-150 ease-calm hover:bg-white/10 active:scale-[0.98] sm:w-auto"
          >
            {t.home.hero.seeImpact}
          </a>
        </motion.div>

        {/* Numbers on tap — transparency stays one touch away, but the
            story leads. The full public ledger lives on /feed. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: reduceMotion ? 0 : 1.4,
            duration: reduceMotion ? 0 : 0.5,
          }}
          className="mt-8 flex flex-col items-center"
        >
          <button
            type="button"
            onClick={() => setShowNumbers((v) => !v)}
            aria-expanded={showNumbers}
            className="text-[13px] font-semibold text-[#B0A18C] underline decoration-dotted underline-offset-4 transition-colors hover:text-[#F3EAD9]"
          >
            {showNumbers ? t.home.hero.hideNumbers : t.home.hero.seeNumbers}
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
                    { label: t.home.hero.givenByDonors, value: stats.totalIn, color: 'var(--amber)', delay: 0.1, money: true },
                    { label: t.home.hero.sentToField, value: stats.totalOut, color: 'var(--terra)', delay: 0.2, money: true },
                    { label: t.home.hero.familiesHelped, value: stats.familiesHelped, color: 'var(--sage)', delay: 0.3, money: false },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center px-8 py-4 md:py-5">
                      <CountUp
                        value={s.value}
                        delay={s.delay}
                        format={s.money ? formatMoneyShort : formatCount}
                        className="font-mono text-2xl font-medium leading-none text-[#F3EAD9] md:text-3xl"
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
        </motion.div>
      </div>

      <ScrollCue opacity={cueOpacity} label={t.home.hero.scroll} />
    </section>
  );
}
