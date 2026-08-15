/**
 * STORY view (spec §3, §18–19) — the mission as a day-by-day record.
 *
 * Day 1 is 10 Aug 2026 (the earthquake). Every approved LAPA entry —
 * donations, purchases, deliveries, field photos — lands on its mission
 * day automatically. Alongside, the verified public record (named sources,
 * never styled as LAPA activity) gives the day context until our own
 * reports fill it. Days render chronologically: Day 1 → today.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { currentMissionDay, missionDay, missionDayLabel } from '@/lib/mission';
import { CONTEXT_MILESTONES, type ContextMilestone } from '@/lib/missionContext';
import type { FeedEntry, MediaItem, Transfer } from '@/lib/types';
import FeedEntryCard from './FeedEntryCard';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function ContextCard({ item, index }: { item: ContextMilestone; index: number }) {
  const { t, lang } = useLanguage();
  const title = lang === 'es' ? item.titleEs : item.titleEn;
  const body = lang === 'es' ? item.bodyEs : item.bodyEn;
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, ease: EASE, delay: Math.min(index * 0.05, 0.2) }}
      className="rounded-card border border-dashed border-border-strong bg-surface-2/60 p-4"
    >
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-faint">
        <BadgeCheck className="h-3.5 w-3.5 text-sage" />
        {t.story.contextLabel}
        {item.time ? <span aria-hidden>· {item.time}</span> : null}
      </p>
      <h3 className="mt-2 font-display text-[18px] font-medium leading-[1.25] text-text">
        {title}
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-[1.55] text-text-muted">{body}</p>
      {item.photo ? (
        <figure className="mt-3">
          <img
            src={item.photo}
            alt={title}
            loading="lazy"
            className="w-full rounded-[10px] border border-border object-cover"
          />
          {item.photoCredit ? (
            <figcaption className="mt-1.5 text-[11px] font-medium text-text-faint">
              {item.photoCredit}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2.5 inline-flex items-center gap-1 text-[12px] font-semibold text-amber underline-offset-2 hover:underline"
      >
        {t.story.sourcePrefix}: {item.sourceName} →
      </a>
    </motion.article>
  );
}

export default function StoryTimeline({
  entries,
  freshIds,
  transfersById,
  onOpenPhoto,
  onOpenProof,
  shareable = true,
}: {
  entries: FeedEntry[];
  freshIds: ReadonlySet<string>;
  transfersById: Map<string, Transfer>;
  onOpenPhoto?: (media: MediaItem) => void;
  onOpenProof?: (url: string, caption: string) => void;
  /** preview/demo content is never shareable as if it were real (§24) */
  shareable?: boolean;
}) {
  const { t, lang } = useLanguage();
  const today = currentMissionDay();

  const days = useMemo(() => {
    const byDay = new Map<number, FeedEntry[]>();
    for (const e of entries) {
      const d = missionDay(e.ts);
      if (d < 1) continue;
      const arr = byDay.get(d) ?? [];
      arr.push(e);
      byDay.set(d, arr);
    }
    const contextByDay = new Map<number, ContextMilestone[]>();
    for (const m of CONTEXT_MILESTONES) {
      const arr = contextByDay.get(m.day) ?? [];
      arr.push(m);
      contextByDay.set(m.day, arr);
    }
    const allDays = new Set([...byDay.keys(), ...contextByDay.keys()]);
    // Chronological: Day 1 → today (spec: "in consecutive order from day one").
    return [...allDays]
      .filter((d) => d <= Math.max(today, 1))
      .sort((a, b) => a - b)
      .map((d) => ({
        day: d,
        entries: (byDay.get(d) ?? []).sort((a, b) => a.ts - b.ts),
        context: contextByDay.get(d) ?? [],
      }));
  }, [entries, today]);

  return (
    <div className="flex flex-col gap-10 pb-6">
      {days.map(({ day, entries: dayEntries, context }) => (
        <section key={day} aria-label={missionDayLabel(day, lang)}>
          {/* Day header */}
          <div className="flex items-center gap-3">
            <h2 className="font-display text-[22px] font-medium tracking-[-0.01em] text-text">
              {missionDayLabel(day, lang)}
            </h2>
            {day === today ? (
              <span className="rounded-full bg-amber px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                {t.story.todayChip}
              </span>
            ) : null}
            <span className="h-px flex-1 bg-border" aria-hidden />
          </div>
          {/* Final copy pass §18 — chapter line for the days we can speak
              to without inventing facts (1, 2, and today). */}
          {day === 1 || day === 2 || (day === today && day > 2) ? (
            <p className="mt-1.5 font-display text-[15px] italic leading-[1.4] text-text-muted">
              {day === 1
                ? t.story.chapters.day1
                : day === 2
                  ? t.story.chapters.day2
                  : t.story.chapters.today}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-3">
            {/* LAPA activity first — it's the point of the platform. */}
            {dayEntries.map((e) => (
              <FeedEntryCard
                key={e.id}
                entry={e}
                fresh={freshIds.has(e.id)}
                transfersById={transfersById}
                onOpenPhoto={onOpenPhoto}
                onOpenProof={onOpenProof}
                shareable={shareable}
              />
            ))}
            {dayEntries.length === 0 && context.length > 0 && (
              <p className="text-[12px] font-medium italic text-text-faint">{t.story.noEntries}</p>
            )}
            {/* Verified public record for the day. */}
            {context.map((m, i) => (
              <ContextCard key={`${day}-${i}`} item={m} index={i} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
