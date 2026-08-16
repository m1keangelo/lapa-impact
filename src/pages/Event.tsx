/**
 * Event — /event (FINAL(2) PART 54/70/96). The fundraiser night for
 * Colombia, driven by the Firestore `events/current` document — nothing
 * hard-coded. Flow: NAME → DATE/LOCATION → WHY → WHAT'S HAPPENING →
 * TICKET/DONATE → BUSINESSES → WAYS TO HELP → SEE WHERE THE HELP GOES.
 * Before the first admin publish the page renders SEED_EVENT, which holds
 * only confirmed organizer-supplied facts (PART 61/112 — never invented).
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  HandCoins,
  MapPin,
  Mic2,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useEvent } from '@/hooks/useEvent';
import { eventImageFor } from '@/lib/eventData';
import { formatMoneyShort } from '@/lib/format';
import FlyerViewer from '@/components/FlyerViewer';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Event() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLanguage();
  const { event } = useEvent();
  const [flyerOpen, setFlyerOpen] = useState(false);
  const poster = eventImageFor(event, lang);

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

  const locationValue = event.venueName
    ? `${event.venueName} · ${event.address}`
    : null;

  const metaRows = [
    {
      icon: CalendarDays,
      label: t.event.dateLabel,
      value: event.dateLabel ? event.dateLabel[lang] : null,
    },
    {
      icon: Clock,
      label: t.event.timeLabel,
      value: event.timeLabel ? event.timeLabel[lang] : null,
    },
    { icon: MapPin, label: t.event.locationLabel, value: locationValue },
  ];

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-container px-5 pb-24 pt-12 md:px-8 md:pt-16">
        {/* ── NAME ───────────────────────────────────────────────── */}
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
            {event.title ? event.title[lang] : t.event.fallbackTitle}
          </motion.h1>

          {/* Real event photo or poster once one exists (PART 70) —
              the visitor's language side first. Tap → full-size flyer. */}
          {poster ? (
            <figure className="relative mt-8">
              <button
                type="button"
                onClick={() => setFlyerOpen(true)}
                aria-label={t.event.viewFull}
                className="group relative block w-full cursor-zoom-in"
              >
                <img
                  src={poster}
                  alt={event.title ? event.title[lang] : t.event.fallbackTitle}
                  className="w-full rounded-card border border-border object-cover"
                  loading="lazy"
                />
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-medium text-white opacity-90 transition-opacity group-hover:opacity-100">
                  {t.event.viewFull}
                </span>
              </button>
            </figure>
          ) : null}

          {/* ── DATE / TIME / LOCATION ───────────────────────────── */}
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

        {/* ── WHY ────────────────────────────────────────────────── */}
        <motion.section {...rise(0)} className="mt-16 max-w-[680px]">
          <h2 className="font-display text-[28px] font-medium leading-[1.15] tracking-[-0.015em] text-text md:text-4xl">
            {t.event.emotionTitle}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.65] text-text-muted">
            {t.event.emotionBody}
          </p>
        </motion.section>

        {/* ── WHAT'S HAPPENING ───────────────────────────────────── */}
        <section className="mt-16" aria-label={t.event.whatTitle}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
            {t.event.whatTitle}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {event.performers.map((p) => (
              <span
                key={p.name}
                className="inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber-glow px-3.5 py-2 text-[13px] font-semibold tracking-[0.01em] text-text"
              >
                <Mic2 className="h-3.5 w-3.5 text-amber" aria-hidden />
                {p.name}
                <span className="font-medium text-text-muted">· {p.role[lang]}</span>
              </span>
            ))}
            {event.features.map((f) => (
              <span
                key={f.en}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-2 text-[13px] font-medium tracking-[0.01em] text-text-muted"
              >
                <Sparkles className="h-3.5 w-3.5 text-text-faint" aria-hidden />
                {f[lang]}
              </span>
            ))}
          </div>
        </section>

        {/* ── TICKET / DONATE — static card (buttons never animate) ── */}
        <section
          className="mt-16 rounded-card border border-amber/40 bg-surface p-6 md:p-8"
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
                  {formatMoneyShort(event.ticketPriceCents)} {t.event.ticketTitle}
                </h2>
                <p className="mt-2 max-w-[46ch] text-[14px] font-medium leading-[1.55] tracking-[0.01em] text-text-muted">
                  {t.event.ticketBody}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
              {event.ticketUrl ? (
                <a
                  href={event.ticketUrl}
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
        </section>

        {/* ── BUSINESSES SHOWING UP ──────────────────────────────── */}
        {event.businesses.length > 0 ? (
          <section className="mt-20" aria-label={t.event.bizTitle}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
              {t.event.bizTitle}
            </p>
            <h2 className="mt-3 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.015em] text-text md:text-4xl">
              {t.event.bizSub}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {event.businesses.map((biz) => (
                <li
                  key={biz.name}
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
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ── WAYS TO HELP ───────────────────────────────────────── */}
        <motion.section {...rise(0)} className="mt-20 max-w-[680px]" aria-label={t.event.waysTitle}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
            {t.event.waysTitle}
          </p>
          <ul className="mt-5 space-y-2.5">
            {t.event.ways.map((way) => (
              <li
                key={way}
                className="flex items-baseline gap-3 text-[16px] font-medium leading-[1.5] tracking-[0.01em] text-text"
              >
                <span className="h-1.5 w-1.5 shrink-0 translate-y-[-2px] rounded-full bg-amber" aria-hidden />
                {way}
              </li>
            ))}
          </ul>
          <Link
            to="/feed"
            className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold tracking-[0.01em] text-amber transition-colors hover:text-amber-soft"
          >
            {t.event.seeWhere}
          </Link>
        </motion.section>

        {/* ── Closer (PART 14 — the giving line lives here) ──────── */}
        <motion.p
          {...rise(0)}
          className="mt-20 max-w-[680px] font-display text-[22px] font-medium leading-[1.3] tracking-[-0.01em] text-text md:text-3xl"
        >
          {t.event.grow}
        </motion.p>
      </div>

      {/* Tap the poster → the full-size flyer */}
      <FlyerViewer
        src={flyerOpen ? poster : null}
        alt={event.title ? event.title[lang] : t.event.fallbackTitle}
        onClose={() => setFlyerOpen(false)}
      />
    </div>
  );
}
