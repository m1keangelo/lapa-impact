/**
 * Live Feed — `/feed` (feed.md). The public real-time ledger: donations,
 * transfers, field updates and photos in one day-grouped stream. Sticky
 * filter chips + client-side search, signature live-insert animation,
 * expandable entries with proof chips, desktop sidebar, bounded queries
 * with "load more", and the 4 designed states (loading/empty/error/live).
 */
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Camera, HandCoins, Inbox, Newspaper, Search, Send, X } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import LiveBadge from '@/components/LiveBadge';
import PreviewChip from '@/components/PreviewChip';
import { useLanguage, type LanguageContextValue } from '@/i18n/LanguageContext';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { usePublicFeed } from '@/hooks/usePublicFeed';
import { formatCount, formatMoney, formatRelativeTime } from '@/lib/format';
import type { FeedEntry, MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import FeedEntryCard from './feed/FeedEntryCard';
import FeedSidebar from './feed/FeedSidebar';
import StoryTimeline from './feed/StoryTimeline';
import Lightbox, { type LightboxPhoto } from './gallery/Lightbox';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type FilterKind = 'all' | 'donation' | 'transfer' | 'update' | 'photo';

function buildFilters(t: LanguageContextValue['t']): { id: FilterKind; label: string; dot: string | null }[] {
  return [
    { id: 'all', label: t.feed.filters.all, dot: null },
    { id: 'donation', label: t.feed.filters.donations, dot: 'var(--amber)' },
    { id: 'transfer', label: t.feed.filters.purchases, dot: 'var(--terra)' },
    { id: 'update', label: t.feed.filters.updates, dot: 'var(--sage)' },
    { id: 'photo', label: t.feed.filters.photos, dot: 'var(--text)' },
  ];
}

/** Day-group label: TODAY / YESTERDAY / "MAR 12, 2025" (localized). */
function dayLabel(ts: number, t: LanguageContextValue['t'], lang: 'en' | 'es'): string {
  const d = new Date(ts);
  const dayStart = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((dayStart(new Date()) - dayStart(d)) / 86400000);
  if (diffDays <= 0) return t.feed.today;
  if (diffDays === 1) return t.feed.yesterday;
  return d
    .toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

/** Static inline stat for the header row — numbers never animate
    (TYPOGRAPHIC MOTION ONLY). */
function InlineStat({ value, format, color }: { value: number; format: (n: number) => string; color: string }) {
  return (
    <span className="font-mono font-medium" style={{ color, fontVariantNumeric: 'tabular-nums' }}>
      {format(value)}
    </span>
  );
}

function entryMatchesSearch(entry: FeedEntry, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay: string[] = [];
  if (entry.kind === 'donation') {
    hay.push(entry.donation.donorName ?? '', entry.donation.note ?? '', entry.donation.noteEs ?? '');
  } else if (entry.kind === 'transfer') {
    hay.push(
      entry.transfer.recipient,
      entry.transfer.purpose,
      entry.transfer.recipientEs ?? '',
      entry.transfer.purposeEs ?? '',
    );
  } else if (entry.kind === 'update') {
    hay.push(
      entry.update.title,
      entry.update.body,
      entry.update.titleEs ?? '',
      entry.update.bodyEs ?? '',
    );
  } else {
    hay.push(entry.media.caption ?? '', entry.media.captionEs ?? '');
  }
  return hay.join(' ').toLowerCase().includes(needle);
}

function FeedSkeleton() {
  const { t } = useLanguage();
  return (
    <div className="space-y-3" aria-label={t.feed.loadingAria}>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
          <div className="h-10 w-10 rounded-full bg-surface-2" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-surface-2" />
            <div className="h-3 w-1/3 rounded bg-surface-2" />
          </div>
          <div className="h-3.5 w-14 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}

export default function Feed() {
  const { stats } = useGlobalStats();
  const feed = usePublicFeed();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const reduceMotion = useReducedMotion();
  const FILTERS = buildFilters(t);

  // Functional-section text reveal (TYPOGRAPHIC MOTION §6): fast, short,
  // once — comprehension is never delayed.
  const textIn = (delay: number, y = 14) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduceMotion ? 0 : 0.4, ease: EASE, delay: reduceMotion ? 0 : delay },
  });

  const [view, setView] = useState<'now' | 'story'>('now');
  const [filter, setFilter] = useState<FilterKind>('all');
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ photos: LightboxPhoto[]; index: number } | null>(null);

  // Lookup maps for photo "matched" chips + lightbox attribution.
  const donationById = useMemo(() => new Map(feed.donations.map((d) => [d.id, d])), [feed.donations]);
  const updateById = useMemo(() => new Map(feed.updates.map((u) => [u.id, u])), [feed.updates]);
  // Proof chain: update → the purchase that paid for it.
  const transfersById = useMemo(
    () => new Map(feed.transfers.map((tr) => [tr.id, tr])),
    [feed.transfers],
  );

  const visibleEntries = useMemo(
    () =>
      feed.entries.filter(
        (e) => (filter === 'all' || e.kind === filter) && entryMatchesSearch(e, search),
      ),
    [feed.entries, filter, search],
  );

  const groups = useMemo(() => {
    const out: { label: string; entries: FeedEntry[] }[] = [];
    for (const e of visibleEntries) {
      const label = dayLabel(e.ts, t, lang);
      const last = out[out.length - 1];
      if (last && last.label === label) last.entries.push(e);
      else out.push({ label, entries: [e] });
    }
    return out;
  }, [visibleEntries, t, lang]);

  // Honor /feed#entry-<id> (lightbox attribution chips link here).
  const [flashedId, setFlashedId] = useState<string | null>(null);
  useEffect(() => {
    if (!location.hash.startsWith('#entry-')) return;
    const el = document.getElementById(location.hash.slice(1));
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const id = location.hash.slice(7);
    const raf = requestAnimationFrame(() => setFlashedId(id));
    return () => cancelAnimationFrame(raf);
  }, [location.hash, groups]);
  useEffect(() => {
    if (!flashedId) return;
    const t = setTimeout(() => setFlashedId(null), 2400);
    return () => clearTimeout(t);
  }, [flashedId]);

  const openMediaLightbox = (media: MediaItem) => {
    const photos: LightboxPhoto[] = (view === 'story' ? feed.entries : visibleEntries)
      .filter((e): e is Extract<FeedEntry, { kind: 'photo' }> => e.kind === 'photo')
      .map((e) => ({
        media: e.media,
        donation: e.media.donationId ? donationById.get(e.media.donationId) : undefined,
        update: e.media.updateId ? updateById.get(e.media.updateId) : undefined,
      }));
    const index = photos.findIndex((p) => p.media.id === media.id);
    setLightbox({ photos, index: Math.max(0, index) });
  };

  const openProofLightbox = (url: string, caption: string) => {
    const proof: MediaItem = {
      id: `proof-${url}`,
      cloudinaryUrl: url,
      thumbnailUrl: url,
      caption,
      timestamp: Date.now(),
    };
    setLightbox({ photos: [{ media: proof }], index: 0 });
  };

  const status = feed.status;
  const filterLabel =
    filter === 'all'
      ? t.feed.filters.entries
      : (FILTERS.find((f) => f.id === filter)?.label ?? t.feed.filters.entries).toLowerCase();

  return (
    <div className="mx-auto w-full max-w-container px-5 md:px-8">
      {/* ——— Section 1: header ——— */}
      <section className="pt-10">
        <div className="flex items-center justify-between gap-4">
          <motion.p className="eyebrow flex items-center gap-2" {...textIn(0, 12)}>
            <span className="inline-block h-px w-4 bg-amber" aria-hidden />
            {t.feed.eyebrow}
          </motion.p>
          {feed.isDemo ? (
            <PreviewChip />
          ) : (
            <LiveBadge label={t.feed.liveColombia} />
          )}
        </div>
        <motion.h1
          className="mt-4 font-sans font-bold leading-[1.1] tracking-[-0.02em] text-text"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)' }}
          {...textIn(0.07, 18)}
        >
          {t.feed.title}
        </motion.h1>
        <motion.p
          className="mt-4 max-w-[56ch] text-[16px] leading-[1.6] text-text-muted md:text-[17px]"
          {...textIn(0.14, 14)}
        >
          {t.feed.sub}
        </motion.p>

        {/* §6 — preview content is ALWAYS clearly labeled, never mistaken
            for real campaign activity. Static card (not typography). */}
        {feed.isDemo ? (
          <div className="mt-6 max-w-[640px] rounded-card border border-amber/40 bg-amber-glow p-5">
            <PreviewChip />
            <p className="mt-2 text-[12px] font-bold uppercase tracking-[0.14em] text-amber">
              {t.publicMode.demoDataLabel}
            </p>
            <p className="mt-3 font-display text-[19px] font-medium tracking-[-0.01em] text-text">
              {t.publicMode.previewTitle}
            </p>
            <p className="mt-1 text-[14px] leading-[1.55] text-text-muted">
              {t.publicMode.previewBody}
            </p>
          </div>
        ) : null}

        <motion.p
          className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] tracking-[0.01em] text-text-muted"
          {...textIn(0.2, 12)}
        >
          <InlineStat value={stats.totalIn} format={(n) => t.feed.moneyIn(formatMoney(n))} color="var(--amber)" />
          <span aria-hidden>·</span>
          <InlineStat value={stats.totalOut} format={(n) => t.feed.moneyOut(formatMoney(n))} color="var(--terra)" />
          <span aria-hidden>·</span>
          <InlineStat value={stats.familiesHelped} format={(n) => t.feed.familiesCount(formatCount(n))} color="var(--sage)" />
          <span aria-hidden>·</span>
          <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {t.feed.entriesCount(formatCount(feed.totalLoaded))}
          </span>
        </motion.p>

        {/* §18 — a quiet freshness signal, not a dashboard widget */}
        {feed.entries[0] ? (
          <motion.p
            className="mt-2 text-[12px] tracking-[0.01em] text-text-faint"
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.26 }}
          >
            {t.feed.lastUpdated(formatRelativeTime(feed.entries[0].ts, lang))}
          </motion.p>
        ) : null}

        {/* NOW vs STORY (spec §18–19): live stream ↔ day-by-day record.
            Static control — buttons never animate. */}
        <div
          className="mt-6 inline-flex rounded-full border border-border bg-surface p-1"
          role="tablist"
          aria-label={t.story.storyTitle}
        >
          {(['now', 'story'] as const).map((v) => {
            const active = view === v;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(v)}
                className={cn(
                  'relative h-8 rounded-full px-4 text-[13px] font-semibold transition-colors duration-200 ease-calm',
                  active ? 'text-white' : 'text-text-muted hover:text-text',
                )}
              >
                {active ? (
                  <span className="absolute inset-0 rounded-full bg-amber" />
                ) : null}
                <span className="relative">{v === 'now' ? t.story.nowTab : t.story.storyTab}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ——— Section 2: sticky filter bar (NOW view only) ——— */}
      {view === 'now' ? (
      <div className="sticky top-[60px] z-40 -mx-5 mt-8 border-b border-border bg-bg px-5 md:-mx-8 md:px-8">
        <div className="flex min-h-[56px] flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label={t.feed.filterAria}>
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200',
                    active ? 'text-text' : 'text-text-muted hover:text-text',
                  )}
                >
                  {active ? (
                    <span className="absolute inset-0 rounded-full bg-surface-3" />
                  ) : null}
                  {f.dot ? (
                    <span className="relative h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.dot }} aria-hidden />
                  ) : null}
                  <span className="relative">{f.label}</span>
                  {f.id === 'all' ? (
                    <span
                      className="relative rounded-full bg-surface-2 px-1.5 font-mono text-[10px] text-text-muted"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatCount(feed.totalLoaded)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Search — inline on desktop, expanding icon-button on mobile */}
          <div className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-faint" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.feed.searchPlaceholder}
              aria-label={t.feed.searchPlaceholder}
              className="h-9 w-[200px] rounded-full border border-border bg-surface pl-9 pr-3 text-[13px] text-text placeholder:text-text-faint focus:border-border-strong focus:outline-none"
            />
          </div>
          <button
            type="button"
            aria-label={t.feed.searchPlaceholder}
            onClick={() => setSearchOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:text-text md:hidden"
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>
        </div>
        {searchOpen ? (
          <div className="relative pb-3 md:hidden">
            <Search className="pointer-events-none absolute left-3 top-[18px] h-4 w-4 -translate-y-1/2 text-text-faint" />
            <input
              type="search"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.feed.searchPlaceholder}
              aria-label={t.feed.searchPlaceholder}
              className="h-10 w-full rounded-full border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-text-faint focus:border-border-strong focus:outline-none"
            />
          </div>
        ) : null}
      </div>
      ) : null}

      {/* ——— Section 3 + 4: stream + sidebar ——— */}
      <div className="flex items-start justify-center gap-8 pb-24 pt-8">
        <main className="w-full max-w-[680px]" aria-live="polite">
          {status === 'loading' ? <FeedSkeleton /> : null}

          {view === 'story' && status !== 'loading' && status !== 'error' ? (
            <StoryTimeline
              entries={feed.entries}
              freshIds={feed.freshIds}
              transfersById={transfersById}
              onOpenPhoto={openMediaLightbox}
              onOpenProof={openProofLightbox}
              shareable={!feed.isDemo}
            />
          ) : null}

          {status === 'error' ? (
            <div className="flex flex-col items-center gap-3 rounded-card border border-danger/40 bg-surface px-6 py-14 text-center">
              <AlertTriangle className="h-12 w-12 text-danger" strokeWidth={1.25} />
              <h3 className="font-display text-xl font-medium text-text">{t.feed.errorTitle}</h3>
              <p className="max-w-[40ch] text-[13px] font-medium text-text-muted">
                {t.feed.errorBody}
              </p>
              <button
                type="button"
                onClick={feed.retry}
                className="mt-2 rounded-[10px] border border-amber px-4 py-2 text-sm font-semibold text-amber transition-colors duration-150 hover:bg-amber/10"
              >
                {t.common.retry}
              </button>
            </div>
          ) : null}

          {view === 'now' && status !== 'loading' && status !== 'error' ? (
            visibleEntries.length === 0 ? (
              /* §53 — when the whole ledger is still empty, the empty state
                 IS the message: the mission is just beginning. */
              status === 'empty' && !search && filter === 'all' ? (
                <EmptyState
                  icon={Inbox}
                  title={t.feed.missionEmptyTitle}
                  body={t.feed.missionEmptyBody}
                />
              ) : (
              <EmptyState
                icon={filter === 'photo' ? Camera : filter === 'donation' ? HandCoins : filter === 'transfer' ? Send : filter === 'update' ? Newspaper : Inbox}
                title={t.feed.emptyTitle}
                body={
                  search
                    ? t.feed.emptySearch(search)
                    : t.feed.emptyFilter(filterLabel)
                }
              />
              )
            ) : (
              <div className="space-y-8">
                {groups.map((group) => (
                  <section key={group.label}>
                    <motion.header
                      className="sticky top-[116px] z-30 mb-3 flex items-center gap-3 bg-bg py-1"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.8 }}
                      transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
                    >
                      <h2
                        className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-text-faint"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {group.label}
                      </h2>
                      <span className="h-px flex-1 bg-border" aria-hidden />
                    </motion.header>

                    <div className="space-y-4">
                      {group.entries.map((entry) => (
                        <div key={`${entry.kind}-${entry.id}`} id={`entry-${entry.id}`}>
                          <FeedEntryCard
                            entry={entry}
                            shareable={!feed.isDemo}
                            fresh={feed.freshIds.has(entry.id) || flashedId === entry.id}
                            matched={
                              entry.kind === 'photo'
                                ? Boolean(entry.media.donationId || entry.media.updateId)
                                : undefined
                            }
                            transfersById={transfersById}
                            onOpenPhoto={openMediaLightbox}
                            onOpenProof={openProofLightbox}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                {/* Load more */}
                {feed.hasMore ? (
                  <div className="pt-2">
                    {feed.loadingMore ? (
                      <div className="space-y-3">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex animate-pulse items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
                            <div className="h-10 w-10 rounded-full bg-surface-2" />
                            <div className="flex-1 space-y-2">
                              <div className="h-3.5 w-1/2 rounded bg-surface-2" />
                              <div className="h-3 w-1/4 rounded bg-surface-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={feed.loadMore}
                        className="w-full rounded-card border border-border bg-transparent py-3 font-mono text-[13px] tracking-[0.01em] text-text-muted transition-colors duration-200 ease-calm hover:border-border-strong hover:bg-surface hover:text-text"
                      >
                        {t.feed.loadMore}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            )
          ) : null}
        </main>

        <FeedSidebar
          donations={feed.donations}
          transfers={feed.transfers}
          updates={feed.updates}
          totalEntries={feed.totalLoaded}
        />
      </div>

      {/* Shared lightbox: feed photos + transfer proofs */}
      <Lightbox
        photos={lightbox?.photos ?? []}
        index={lightbox?.index ?? null}
        onClose={() => setLightbox(null)}
        onNavigate={(i) => setLightbox((lb) => (lb ? { ...lb, index: i } : lb))}
      />
    </div>
  );
}
