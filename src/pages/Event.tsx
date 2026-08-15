/**
 * Event — /event (master §40–44). The fundraiser night for Colombia:
 * name/date/time/location render as clearly-marked PENDING chips until the
 * organizer confirms them (§44 — never fabricated), the $25 solidarity
 * ticket links to Stripe, and "Businesses showing up" celebrates the local
 * businesses carrying the night — only confirmed ones, ever.
 */
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  HandCoins,
  MapPin,
  Ticket,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { EVENT } from '@/lib/campaign';
import { STRIPE_PAYMENT_LINK } from '@/lib/donate';
import { formatMoneyShort } from '@/lib/format';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Event() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLanguage();

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.5,
      ease: EASE,
    },
  });

  const pendingChip = (
    <span className="inline-flex items-center rounded-full border border-dashed border-border-strong px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-faint">
      {t.event.pendingChip}
    </span>
  );

  const metaRows = [
    {
      icon: CalendarDays,
      label: t.event.dateLabel,
      value: EVENT.dateLabel ? EVENT.dateLabel[lang] : null,
    },
    { icon: Clock, label: t.event.timeLabel, value: EVENT.timeLabel },
    { icon: MapPin, label: t.event.locationLabel, value: EVENT.locationLabel },
  ];

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-container px-5 pb-24 pt-12 md:px-8 md:pt-16">
        {/* ── Header ─────────────────────────────────────────────── */}
        <header className="max-w-[720px]">
          <motion.p
            {...rise(0)}
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber"
          >
            {t.event.eyebrow}
          </motion.p>
          <motion.h1
            {...rise(0.08)}
            className="mt-4 font-display text-[36px] font-medium leading-[1.08] tracking-[-0.015em] text-text md:text-6xl"
          >
            {EVENT.title ?? t.event.fallbackTitle}
          </motion.h1>

          {/* Date / time / location — pending until confirmed (§44) */}
          <motion.ul {...rise(0.16)} className="mt-8 space-y-3">
            {metaRows.map((row) => (
              <li key={row.label} className="flex items-center gap-3">
                <row.icon className="h-4 w-4 shrink-0 text-text-faint" aria-hidden />
                <span className="w-20 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                  {row.label}
                </span>
                {row.value ? (
                  <span className="text-[15px] font-medium tracking-[0.01em] text-text">
                    {row.value}
                  </span>
                ) : (
                  pendingChip
                )}
              </li>
            ))}
          </motion.ul>
        </header>

        {/* ── Ticket card ────────────────────────────────────────── */}
        <motion.section
          {...rise(0.1)}
          className="mt-12 rounded-card border border-amber/40 bg-surface p-6 md:p-8"
          aria-label={t.event.ticketTitle}
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber/10"
                aria-hidden
              >
                <Ticket className="h-5 w-5 text-amber" />
              </span>
              <div>
                <h2 className="font-display text-2xl font-medium tracking-[-0.01em] text-text">
                  {formatMoneyShort(EVENT.ticketPriceCents)} {t.event.ticketTitle}
                </h2>
                <p className="mt-2 max-w-[46ch] text-[14px] font-medium leading-[1.55] tracking-[0.01em] text-text-muted">
                  {t.event.ticketBody}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              {STRIPE_PAYMENT_LINK ? (
                <a
                  href={STRIPE_PAYMENT_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-amber px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
                >
                  {t.event.getTicket}
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              ) : null}
              <Link
                to="/donate"
                className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-border-strong px-6 py-3.5 text-[15px] font-semibold text-text transition-all duration-150 ease-calm hover:bg-surface-2/60 active:scale-[0.98]"
              >
                <HandCoins className="h-4 w-4" />
                {t.event.donateCta}
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ── Emotional beat ─────────────────────────────────────── */}
        <motion.section {...rise(0)} className="mt-20 max-w-[680px]">
          <h2 className="font-display text-[28px] font-medium leading-[1.15] tracking-[-0.015em] text-text md:text-4xl">
            {t.event.emotionTitle}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.65] text-text-muted">
            {t.event.emotionBody}
          </p>
        </motion.section>

        {/* ── Businesses showing up (§43) ────────────────────────── */}
        <motion.section {...rise(0)} className="mt-20" aria-label={t.event.bizTitle}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
            {t.event.bizTitle}
          </p>
          <h2 className="mt-3 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.015em] text-text md:text-4xl">
            {t.event.bizSub}
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EVENT.businesses.map((biz, i) => (
              <motion.li
                key={biz.name}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{
                  delay: reduceMotion ? 0 : 0.05 * i,
                  duration: reduceMotion ? 0 : 0.45,
                  ease: EASE,
                }}
                className="rounded-card border border-border bg-surface p-5"
              >
                <p className="font-display text-[17px] font-semibold tracking-[0.02em] text-text">
                  {biz.name}
                </p>
                <p className="mt-1.5 text-[13px] font-medium leading-[1.45] tracking-[0.01em] text-text-muted">
                  {biz.gives[lang]}
                </p>
                <span className="mt-3 inline-flex rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-text-faint">
                  {biz.kind[lang]}
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
