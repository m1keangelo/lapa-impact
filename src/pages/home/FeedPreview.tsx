/**
 * Home Section 4 — Live feed preview (home.md §Section 4).
 * Left: 6 most recent mixed FeedItems from the bounded onSnapshot queries.
 * Right: featured photo card (latest media item). Live inserts slide down
 * with a temporary amber left border that fades over 2s.
 */
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import FeedItem from '@/components/FeedItem';
import LiveBadge from '@/components/LiveBadge';
import EmptyState from '@/components/EmptyState';
import { useCombinedFeed, useFeed } from '@/hooks/useFeed';
import { useLanguage, type LanguageContextValue } from '@/i18n/LanguageContext';
import { firebaseReady } from '@/lib/firebase';
import { demoMedia } from '@/lib/demoData';
import { formatRelativeTime, pickLang, pickMetrics, toMillis } from '@/lib/format';
import type { FeedEntry, MediaItem } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function entryToProps(
  entry: FeedEntry,
  t: LanguageContextValue['t'],
  lang: LanguageContextValue['lang'],
): {
  variant: 'donation' | 'transfer' | 'update' | 'photo';
  title: string;
  meta?: string;
  amount?: number;
  detail?: string;
} {
  switch (entry.kind) {
    case 'donation':
      return {
        variant: 'donation',
        title: t.home.feedPreview.donationTitle(entry.donation.donorName ?? t.common.aDonor),
        meta: entry.donation.note ? pickLang(entry.donation, 'note', lang) : undefined,
        amount: entry.donation.amount,
      };
    case 'transfer':
      return {
        variant: 'transfer',
        title: t.home.feedPreview.transferTitle(pickLang(entry.transfer, 'recipient', lang)),
        meta: pickLang(entry.transfer, 'purpose', lang),
        amount: entry.transfer.amount,
      };
    case 'update':
      return {
        variant: 'update',
        title: pickLang(entry.update, 'title', lang),
        meta: Object.entries(pickMetrics(entry.update, lang))
          .slice(0, 2)
          .map(([k, v]) => `${v} ${k}`)
          .join(' · '),
        detail: pickLang(entry.update, 'body', lang),
      };
    case 'photo':
      return {
        variant: 'photo',
        title: t.home.feedPreview.photoTitle,
        meta: pickLang(entry.media, 'caption', lang),
      };
  }
}

function FeedSkeleton() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-3" aria-label={t.home.feedPreview.loadingAria}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[68px] animate-pulse rounded-card border border-border bg-surface-2"
        />
      ))}
    </div>
  );
}

export default function FeedPreview() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { items, status } = useCombinedFeed(6);
  const mediaQuery = useFeed<MediaItem>('media', { limit: 1 });

  const listRef = useRef<HTMLDivElement>(null);
  const inView = useInView(listRef, { amount: 0.2, once: true });

  // Items timestamped after mount are live inserts — they get the
  // slide-down + amber border flash treatment (no ref reads in render).
  const [mountedAt] = useState(() => Date.now());

  const featured: MediaItem | undefined = firebaseReady
    ? mediaQuery.items[0]
    : [...demoMedia].sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp))[0];

  return (
    <section id="feed-preview" className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto w-full max-w-container px-5 md:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-4 bg-amber" aria-hidden />
              {t.home.feedPreview.eyebrow}
            </p>
            <h2 className="mt-3 font-display text-2xl font-medium leading-[1.2] tracking-[-0.01em] text-text md:text-[32px]">
              {t.home.feedPreview.title}
            </h2>
            <p className="mt-2 max-w-[52ch] text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted">
              {t.home.feedPreview.body}
            </p>
          </div>
          <LiveBadge />
        </div>

        {/* Content grid */}
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          {/* Feed list */}
          <div ref={listRef} className="lg:col-span-7">
            {status === 'loading' ? (
              <FeedSkeleton />
            ) : status === 'error' ? (
              <EmptyState
                icon={AlertTriangle}
                title={t.home.feedPreview.errorTitle}
                body={t.home.feedPreview.errorBody}
                actionLabel={t.common.retry}
                onAction={() => window.location.reload()}
              />
            ) : items.length === 0 ? (
              <EmptyState
                title={t.home.feedPreview.emptyTitle}
                body={t.home.feedPreview.emptyBody}
              />
            ) : (
              <motion.div
                className="flex flex-col gap-3"
                initial="hidden"
                animate={inView ? 'show' : 'hidden'}
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  {items.map((entry) => {
                    const key = `${entry.kind}:${entry.id}`;
                    const isNew = entry.ts > mountedAt + 1000;
                    const p = entryToProps(entry, t, lang);
                    return (
                      <motion.div
                        key={key}
                        layout="position"
                        custom={isNew}
                        variants={{
                          hidden: (n: boolean) => ({
                            opacity: 0,
                            y: reduceMotion ? 0 : n ? -16 : 24,
                          }),
                          show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
                        }}
                        exit={{ opacity: 0 }}
                        className="relative"
                      >
                        {/* live-insert amber left-border flash */}
                        <motion.span
                          aria-hidden
                          initial={{ opacity: isNew && !reduceMotion ? 1 : 0 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 2, ease: 'easeOut' }}
                          className="absolute inset-y-0 left-0 z-10 w-[3px] rounded-l-card bg-amber"
                        />
                        <FeedItem
                          variant={p.variant}
                          title={p.title}
                          meta={p.meta}
                          amount={p.amount}
                          detail={p.detail}
                          timestamp={entry.ts}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            <Link
              to="/feed"
              className="mt-6 inline-block text-sm font-semibold text-amber transition-colors hover:text-amber-soft"
            >
              {t.home.feedPreview.seeFull}
            </Link>
          </div>

          {/* Featured photo card */}
          {featured ? (
            <motion.figure
              initial={{
                opacity: 0,
                clipPath: reduceMotion ? 'inset(0%)' : 'inset(8%)',
              }}
              whileInView={{ opacity: 1, clipPath: 'inset(0%)' }}
              viewport={{ amount: 0.3, once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE }}
              className="lg:col-span-5"
            >
              <button
                type="button"
                onClick={() => navigate(`/gallery?photo=${featured.id}`)}
                className="group block w-full overflow-hidden rounded-card border border-border bg-surface text-left transition-all duration-200 ease-calm hover:-translate-y-0.5 hover:border-border-strong"
              >
                <div className="aspect-[4/5] w-full overflow-hidden">
                  <img
                    src={featured.thumbnailUrl}
                    alt={pickLang(featured, 'caption', lang)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 ease-calm group-hover:scale-[1.03]"
                  />
                </div>
                <figcaption className="p-4">
                  <p className="text-[15px] font-medium leading-snug text-text">
                    {pickLang(featured, 'caption', lang)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {featured.donationId ? (
                      <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-amber">
                        {t.home.feedPreview.matchedChip}
                      </span>
                    ) : null}
                    <span
                      className="font-mono text-[12px] tracking-[0.01em] text-text-muted"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatRelativeTime(featured.timestamp, lang)}
                    </span>
                  </div>
                </figcaption>
              </button>
            </motion.figure>
          ) : null}
        </div>
      </div>
    </section>
  );
}
