/**
 * Home — Event Spotlight (FIN spec §7/§8). Sits right after Quiénes Somos,
 * before the mission sections. Desktop: 55% image / 45% details. Mobile:
 * image first, details below. All facts come from useEvent() (Firestore
 * events/current → confirmed-facts seed), so whatever is published in
 * Admin → Evento shows up here automatically. When no poster exists yet,
 * the image side becomes a LAPA-blue date tile — never a broken image.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, Clock, Expand, MapPin, Ticket } from 'lucide-react';
import { useEvent } from '@/hooks/useEvent';
import { useLanguage } from '@/i18n/LanguageContext';
import { eventImageFor } from '@/lib/eventData';
import { formatMoneyShort } from '@/lib/format';
import FlyerViewer from '@/components/FlyerViewer';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function EventSpotlight() {
  const reduceMotion = useReducedMotion();
  const { t, lang } = useLanguage();
  const { event } = useEvent();
  const s = t.home.eventSpot;

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { amount: 0.3, once: true } as const,
    transition: {
      delay: reduceMotion ? 0 : delay,
      duration: reduceMotion ? 0 : 0.55,
      ease: EASE,
    },
  });

  const title = event.title?.[lang] ?? t.event.fallbackTitle;
  const poster = eventImageFor(event, lang);
  const [flyerOpen, setFlyerOpen] = useState(false);

  return (
    <section className="mx-auto w-full max-w-container px-5 pb-24 md:px-8 md:pb-32">
      <motion.div
        {...rise(0)}
        className="grid items-center gap-8 lg:grid-cols-[55fr_45fr] lg:gap-12"
      >
        {/* ── Image (55%) — poster in the visitor's language when
            published, blue date tile until then ── */}
        {poster ? (
          <figure className="relative overflow-hidden rounded-card border border-border">
            <button
              type="button"
              onClick={() => setFlyerOpen(true)}
              aria-label={s.viewFull}
              className="group block w-full cursor-zoom-in"
            >
              <img
                src={poster}
                alt={title}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/4]"
              />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-medium text-white opacity-90 transition-opacity group-hover:opacity-100">
                <Expand className="h-3.5 w-3.5" aria-hidden />
                {s.viewFull}
              </span>
            </button>
          </figure>
        ) : (
          <div
            aria-hidden
            className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-card bg-[#003D7A] px-8 text-center sm:aspect-[5/4]"
          >
            <Calendar className="h-8 w-8 text-[#F5F1E8]/70" />
            <p className="mt-5 font-display text-[30px] font-medium leading-[1.15] text-[#F5F1E8] md:text-[36px]">
              {event.dateLabel[lang]}
            </p>
            <p className="mt-3 text-[15px] font-medium uppercase tracking-[0.14em] text-[#F5F1E8]/70">
              {event.venueName}
            </p>
          </div>
        )}

        {/* ── Details (45%) ── */}
        <div className="text-center lg:text-left">
          <motion.p
            {...rise(0.05)}
            className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[#003D7A]"
          >
            {s.eyebrow}
          </motion.p>

          <motion.h2
            {...rise(0.1)}
            className="mt-3 font-display text-[28px] font-medium leading-[1.15] tracking-[-0.015em] text-text md:text-[36px]"
          >
            {title}
          </motion.h2>

          <motion.p {...rise(0.16)} className="mt-3 text-[18px] leading-[1.5] text-text-muted">
            {t.event.emotionTitle}
          </motion.p>

          {/* Date / time / location — 16px, organized clearly (FIN §8) */}
          <motion.ul {...rise(0.22)} className="mt-6 space-y-3 text-[16px]">
            <li className="flex items-center justify-center gap-3 lg:justify-start">
              <Calendar className="h-4 w-4 shrink-0 text-[#003D7A]" aria-hidden />
              <span className="font-medium text-text">{event.dateLabel[lang]}</span>
            </li>
            <li className="flex items-center justify-center gap-3 lg:justify-start">
              <Clock className="h-4 w-4 shrink-0 text-[#003D7A]" aria-hidden />
              <span className="text-text-muted">{event.timeLabel[lang]}</span>
            </li>
            <li className="flex items-start justify-center gap-3 lg:justify-start">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#003D7A]" aria-hidden />
              <span className="text-left">
                <span className="block font-medium text-text">{event.venueName}</span>
                <span className="block text-[14px] text-text-muted">{event.address}</span>
              </span>
            </li>
          </motion.ul>

          {/* CTAs — primary blue ticket button, subordinate donate outline (FIN §9) */}
          <motion.div
            {...rise(0.28)}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start"
          >
            <Link
              to="/event"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[4px] bg-[#003D7A] px-8 py-4 text-[16px] font-semibold text-[#F5F1E8] transition-all duration-150 ease-calm hover:bg-[#0A4E97] active:scale-[0.98] sm:w-auto"
            >
              <Ticket className="h-4 w-4" />
              {t.event.getTicket} · {formatMoneyShort(event.ticketPriceCents)}
            </Link>
            <Link
              to="/donate"
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-[4px] border-2 border-[#003D7A] bg-transparent px-8 py-4 text-[16px] font-semibold text-[#003D7A] transition-all duration-150 ease-calm hover:bg-[#003D7A]/5 active:scale-[0.98] sm:w-auto"
            >
              {t.donate.giveNow}
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* Tap the poster → the full-size flyer */}
      <FlyerViewer src={flyerOpen ? poster : null} alt={title} onClose={() => setFlyerOpen(false)} />
    </section>
  );
}
