/**
 * Gallery — `/gallery` (gallery.md). Aspect-preserving CSS-columns masonry
 * wall of field photos with jump-free skeletons, gift-matched chips,
 * filter pills, and the shared full-screen lightbox (keyboard + swipe).
 * Honors the `?photo=<id>` deep-link contract used by the home page tiles.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import LiveBadge from '@/components/LiveBadge';
import { useLanguage, type LanguageContextValue } from '@/i18n/LanguageContext';
import { useMedia } from '@/hooks/useMedia';
import { formatCount, formatRelativeTime, toMillis } from '@/lib/format';
import type { MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import GalleryTile from './gallery/GalleryTile';
import Lightbox, { type LightboxPhoto } from './gallery/Lightbox';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

type GalleryFilter = 'all' | 'matched' | 'updates';

function buildFilters(t: LanguageContextValue['t']): { id: GalleryFilter; label: string; dot: string | null }[] {
  return [
    { id: 'all', label: t.gallery.filters.all, dot: null },
    { id: 'matched', label: t.gallery.filters.matched, dot: 'var(--sage)' },
    { id: 'updates', label: t.gallery.filters.updates, dot: 'var(--amber)' },
  ];
}

function matchesFilter(m: MediaItem, filter: GalleryFilter): boolean {
  if (filter === 'matched') return Boolean(m.donationId);
  if (filter === 'updates') return Boolean(m.updateId);
  return true;
}

function GallerySkeleton() {
  const { t } = useLanguage();
  // Deterministic mixed ratios so the skeleton wall reads like masonry.
  const ratios = ['aspect-[4/3]', 'aspect-[3/4]', 'aspect-square', 'aspect-[4/3]', 'aspect-[3/2]', 'aspect-[3/4]', 'aspect-[4/3]', 'aspect-square'];
  return (
    <div className="columns-2 gap-3 md:columns-3 xl:columns-4" aria-label={t.gallery.loadingAria}>
      {ratios.map((r, i) => (
        <div key={i} className={cn('mb-3 w-full animate-pulse break-inside-avoid rounded-[12px] border border-border bg-surface-2', r)} />
      ))}
    </div>
  );
}

export default function Gallery() {
  const media = useMedia();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<GalleryFilter>('all');
  const { t, lang } = useLanguage();
  const FILTERS = buildFilters(t);

  const visibleItems = useMemo(
    () => media.items.filter((m) => matchesFilter(m, filter)),
    [media.items, filter],
  );

  const photos = useMemo<LightboxPhoto[]>(
    () =>
      visibleItems.map((m) => ({
        media: m,
        donation: m.donationId ? media.donationById.get(m.donationId) : undefined,
        update: m.updateId ? media.updateById.get(m.updateId) : undefined,
      })),
    [visibleItems, media.donationById, media.updateById],
  );

  // Lightbox state is driven by the ?photo=<id> URL param (home tiles
  // deep-link to /gallery?photo=<id>).
  const photoParam = searchParams.get('photo');
  const lightboxIndex = useMemo(() => {
    if (!photoParam) return null;
    const idx = photos.findIndex((p) => p.media.id === photoParam);
    return idx >= 0 ? idx : null;
  }, [photoParam, photos]);

  // If a deep-linked photo sits beyond the first page, grow the bound so
  // it can resolve instead of dead-ending.
  useEffect(() => {
    if (photoParam && lightboxIndex === null && media.status === 'live' && media.hasMore) {
      media.loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoParam, lightboxIndex, media.status, media.hasMore]);

  const openPhoto = useCallback(
    (id: string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('photo', id);
        return next;
      });
    },
    [setSearchParams],
  );

  const closeLightbox = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('photo');
      return next;
    });
  }, [setSearchParams]);

  const navigateLightbox = useCallback(
    (index: number) => {
      const target = photos[index];
      if (target) openPhoto(target.media.id);
    },
    [photos, openPhoto],
  );

  const latestTs = visibleItems.length > 0 ? Math.max(...visibleItems.map((m) => toMillis(m.timestamp))) : 0;

  return (
    <div className="mx-auto w-full max-w-container px-5 md:px-8">
      {/* ——— Section 1: header ——— */}
      <section className="pt-10">
        <div className="flex items-center justify-between gap-4">
          <motion.p
            className="eyebrow flex items-center gap-2"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            <span className="inline-block h-px w-4 bg-amber" aria-hidden />
            {t.gallery.eyebrow}
          </motion.p>
          <LiveBadge />
        </div>

        <h1 className="mt-3 font-display text-[32px] font-medium leading-[1.1] tracking-[-0.015em] text-text md:text-5xl">
          {t.gallery.titleWords.map((word, i) => (
            <span key={word} className="inline-block overflow-hidden pb-1 align-top">
              <motion.span
                className="inline-block"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.06 * i }}
              >
                {word}
                {i < 2 ? ' ' : ''}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          className="mt-3 max-w-[56ch] text-[15px] leading-[1.55] text-text-muted"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
        >
          {t.gallery.sub}
        </motion.p>

        <motion.p
          className="mt-4 font-mono text-[13px] tracking-[0.01em] text-text-muted"
          style={{ fontVariantNumeric: 'tabular-nums' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.26 }}
        >
          {t.gallery.photosCount(formatCount(visibleItems.length))}
          {latestTs ? `${t.gallery.latestPrefix}${formatRelativeTime(latestTs, lang)}` : ''}
        </motion.p>
      </section>

      {/* ——— Section 2: filter row ——— */}
      <div className="mt-8 flex items-center gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label={t.gallery.filterAria}>
        {FILTERS.map((f, i) => {
          const active = filter === f.id;
          return (
            <motion.button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.id)}
              className={cn(
                'relative flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200',
                active ? 'text-text' : 'text-text-muted hover:text-text',
              )}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease: EASE, delay: 0.05 * i }}
            >
              {active ? (
                <motion.span
                  layoutId="gallery-chip-pill"
                  className="absolute inset-0 rounded-full bg-surface-3"
                  transition={{ duration: 0.2, ease: EASE }}
                />
              ) : null}
              {f.dot ? (
                <span className="relative h-1.5 w-1.5 rounded-full" style={{ backgroundColor: f.dot }} aria-hidden />
              ) : null}
              <span className="relative">{f.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ——— Section 3: masonry wall ——— */}
      <section className="pb-24 pt-6">
        {media.status === 'loading' ? <GallerySkeleton /> : null}

        {media.status === 'error' ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-danger/40 bg-surface px-6 py-14 text-center">
            <AlertTriangle className="h-12 w-12 text-danger" strokeWidth={1.25} />
            <h3 className="font-display text-xl font-medium text-text">{t.gallery.errorTitle}</h3>
            <p className="max-w-[40ch] text-[13px] font-medium text-text-muted">
              {t.gallery.errorBody}
            </p>
            <button
              type="button"
              onClick={media.retry}
              className="mt-2 rounded-[10px] border border-amber px-4 py-2 text-sm font-semibold text-amber transition-colors duration-150 hover:bg-amber/10"
            >
              {t.common.retry}
            </button>
          </div>
        ) : null}

        {media.status !== 'loading' && media.status !== 'error' ? (
          visibleItems.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
              <img src="/empty-photos.svg" alt="" className="w-[240px] max-w-full" />
              <h3 className="font-display text-xl font-medium text-text">{t.gallery.emptyTitle}</h3>
              <p className="max-w-[40ch] text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted">
                {t.gallery.emptyBody}
              </p>
              <Link
                to="/feed"
                className="mt-2 inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-2 font-mono text-[13px] text-text-muted transition-colors duration-200 hover:border-border-strong hover:bg-surface hover:text-text"
              >
                {t.gallery.watchFeed}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <>
              <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
                <AnimatePresence initial={false}>
                  {photos.map((p) => (
                    <GalleryTile
                      key={p.media.id}
                      media={p.media}
                      matched={Boolean(p.media.donationId)}
                      onOpen={() => openPhoto(p.media.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {media.hasMore ? (
                <div className="mt-8">
                  {media.loadingMore ? (
                    <div className="columns-2 gap-3 md:columns-3 xl:columns-4">
                      {['aspect-[4/3]', 'aspect-[3/4]', 'aspect-square'].map((r, i) => (
                        <div key={i} className={cn('mb-3 w-full animate-pulse break-inside-avoid rounded-[12px] border border-border bg-surface-2', r)} />
                      ))}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={media.loadMore}
                      className="w-full rounded-card border border-border bg-transparent py-3 font-mono text-[13px] tracking-[0.01em] text-text-muted transition-colors duration-200 ease-calm hover:border-border-strong hover:bg-surface hover:text-text"
                    >
                      {t.gallery.loadMore}
                    </button>
                  )}
                </div>
              ) : null}
            </>
          )
        ) : null}
      </section>

      {/* ——— Section 4: shared lightbox ——— */}
      <Lightbox
        photos={photos}
        index={lightboxIndex}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
      />
    </div>
  );
}
