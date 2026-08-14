/**
 * Impact Section 3 — "What the pot deployed — your share" (dashboard.md §3).
 * A horizontal (desktop) / vertical (mobile) timeline of impact chips
 * derived from field-update metrics, connected by a 2px dashed line that
 * draws itself on scroll-into-view. Empty → Sprout EmptyState.
 */
import { motion } from 'framer-motion';
import {
  Droplets,
  House,
  Mountain,
  Package,
  Sprout,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { useLanguage, type LanguageContextValue } from '@/i18n/LanguageContext';
import { useFeed } from '@/hooks/useFeed';
import { demoUpdates } from '@/lib/demoData';
import { formatRelativeTime, pickMetrics } from '@/lib/format';
import type { ImpactUpdate } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface Chip {
  id: string;
  icon: LucideIcon;
  label: string;
  metric: string;
  ts: ImpactUpdate['timestamp'];
}

/** Matches both English and Spanish metric labels (data can arrive in either). */
function iconFor(metricKey: string): LucideIcon {
  const k = metricKey.toLowerCase();
  if (/water|filter|agua|filtro/.test(k)) return Droplets;
  if (/roof|home|house|repair|techo|teja|vivienda|casa|reparad/.test(k)) return House;
  if (/meal|food|rice|kitchen|comida|arroz|cocina|mercad/.test(k)) return UtensilsCrossed;
  if (/famil|people|gente/.test(k)) return Users;
  if (/vereda|km|village|run|pueblo|viaje|caballo/.test(k)) return Mountain;
  if (/basket|kit|suppl|blanket|mattress|cobija|colchon|suministro/.test(k)) return Package;
  return Sprout;
}

function labelFor(metricKey: string, t: LanguageContextValue['t']): string {
  const k = metricKey.toLowerCase();
  if (/water|filter|agua|filtro/.test(k)) return t.footprint.cleanWater;
  if (/roof|home|house|repair|techo|teja|vivienda|casa|reparad/.test(k)) return t.footprint.roofRepairs;
  if (/meal|food|rice|kitchen|comida|arroz|cocina|mercad/.test(k)) return t.footprint.meals;
  if (/famil|people|gente/.test(k)) return t.footprint.families;
  if (/vereda|km|village|run|pueblo|viaje|caballo/.test(k)) return t.footprint.villages;
  if (/basket|kit|suppl|blanket|mattress|cobija|colchon|suministro/.test(k)) return t.footprint.supplies;
  return t.footprint.fallback;
}

function chipsFromUpdates(
  updates: ImpactUpdate[],
  t: LanguageContextValue['t'],
  lang: LanguageContextValue['lang'],
): Chip[] {
  const chips: Chip[] = [];
  for (const u of updates) {
    for (const [key, value] of Object.entries(pickMetrics(u, lang))) {
      chips.push({
        id: `${u.id}:${key}`,
        icon: iconFor(key),
        label: labelFor(key, t),
        metric: `${value} ${key}`,
        ts: u.timestamp,
      });
    }
  }
  return chips.slice(0, 4);
}

export default function Footprint({ reducedMotion }: { reducedMotion: boolean }) {
  const { t, lang } = useLanguage();
  const feed = useFeed<ImpactUpdate>('updates', { limit: 6 });
  const updates = feed.isDemo ? demoUpdates : feed.items;
  const chips = chipsFromUpdates(updates, t, lang);

  return (
    <motion.section
      initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.2, once: true }}
      transition={{ duration: reducedMotion ? 0 : 0.5, ease: EASE }}
      aria-label={t.footprint.sectionAria}
      className="mt-12 rounded-card border border-border bg-surface p-6"
    >
      <p className="eyebrow flex items-center gap-3">
        <span className="inline-block h-px w-4 bg-amber" aria-hidden />
        {t.footprint.eyebrow}
      </p>

      {feed.status === 'loading' ? (
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:gap-4" aria-label={t.footprint.loadingAria}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 md:flex-1">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-2" />
              <div className="flex-1">
                <div className="h-3.5 w-24 animate-pulse rounded bg-surface-2" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded bg-surface-2" />
              </div>
            </div>
          ))}
        </div>
      ) : chips.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title={t.footprint.emptyTitle}
          body={t.footprint.emptyBody}
          className="mt-5 border-none px-0 py-10"
        />
      ) : (
        <div className="relative mt-6">
          {/* Connecting dashed line (desktop, horizontal) — draws on reveal */}
          <motion.span
            aria-hidden
            initial={reducedMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ amount: 0.2, once: true }}
            transition={{ duration: reducedMotion ? 0 : 0.9, ease: EASE, delay: 0.2 }}
            className="absolute left-0 top-[18px] hidden h-0.5 w-full origin-left border-t-2 border-dashed border-border-strong md:block"
          />
          {/* Mobile vertical line */}
          <motion.span
            aria-hidden
            initial={reducedMotion ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ amount: 0.2, once: true }}
            transition={{ duration: reducedMotion ? 0 : 0.9, ease: EASE, delay: 0.2 }}
            className="absolute bottom-2 left-[17px] top-2 w-0 origin-top border-l-2 border-dashed border-border-strong md:hidden"
          />

          <ol className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-4">
            {chips.map((chip, i) => {
              const Icon = chip.icon;
              return (
                <motion.li
                  key={chip.id}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ amount: 0.2, once: true }}
                  transition={{
                    delay: reducedMotion ? 0 : 0.15 + i * 0.08,
                    duration: reducedMotion ? 0 : 0.45,
                    ease: EASE,
                  }}
                  className="flex items-center gap-3 md:max-w-[220px] md:flex-1 md:flex-col md:items-start"
                >
                  <span className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-2">
                    <Icon className="h-4 w-4 text-sage" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-text">{chip.label}</span>
                    <span
                      className="mt-0.5 block font-mono text-[13px] font-medium text-sage"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {chip.metric}
                    </span>
                    <span
                      className="mt-0.5 block font-mono text-[12px] tracking-[0.01em] text-text-faint"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatRelativeTime(chip.ts, lang)}
                    </span>
                  </span>
                </motion.li>
              );
            })}
          </ol>
        </div>
      )}
    </motion.section>
  );
}
