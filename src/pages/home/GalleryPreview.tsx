/**
 * Home Section 5 — Gallery preview (home.md §Section 5).
 * Horizontal scroll-snap strip of 5 photo tiles (3:4), bottom scrim +
 * caption + mono date, edge fades hinting at more content. Tiles stagger
 * in from the right; tap routes to /gallery with the photo open.
 */
import { Link, useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'framer-motion';
import { useFeed } from '@/hooks/useFeed';
import { firebaseReady } from '@/lib/firebase';
import { demoMedia } from '@/lib/demoData';
import { formatRelativeTime, toMillis } from '@/lib/format';
import type { MediaItem } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function GalleryPreview() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const mediaQuery = useFeed<MediaItem>('media', { limit: 5 });

  const photos: MediaItem[] = firebaseReady
    ? mediaQuery.items
    : [...demoMedia]
        .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp))
        .slice(0, 5);

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto w-full max-w-container px-5 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-4 bg-amber" aria-hidden />
              Proof, not promises
            </p>
            <h2 className="mt-3 font-display text-2xl font-medium leading-[1.2] tracking-[-0.01em] text-text md:text-[32px]">
              From the field.
            </h2>
          </div>
          <Link
            to="/gallery"
            className="text-sm font-semibold text-amber transition-colors hover:text-amber-soft"
          >
            Full gallery →
          </Link>
        </div>
      </div>

      {/* Scroll-snap strip with edge fades */}
      <div className="relative mt-10">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-[linear-gradient(to_right,var(--bg),transparent)] md:w-16"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-[linear-gradient(to_left,var(--bg),transparent)] md:w-16"
          aria-hidden
        />

        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:px-8">
          {photos.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => navigate(`/gallery?photo=${p.id}`)}
              initial={{ opacity: 0, x: reduceMotion ? 0 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ amount: 0.25, once: true }}
              transition={{
                delay: reduceMotion ? 0 : i * 0.08,
                duration: reduceMotion ? 0 : 0.5,
                ease: EASE,
              }}
              className="group relative w-[260px] shrink-0 snap-start overflow-hidden rounded-card border border-border bg-surface text-left transition-colors duration-200 hover:border-border-strong md:w-[320px]"
            >
              <div className="aspect-[3/4] w-full overflow-hidden">
                <img
                  src={p.thumbnailUrl}
                  alt={p.caption}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 ease-calm group-hover:scale-[1.05]"
                />
              </div>
              {/* bottom scrim */}
              <div
                className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(20,16,12,0.9),transparent)] transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="line-clamp-2 text-[13px] font-medium leading-snug text-[#F3EAD9]">
                  {p.caption}
                </p>
                <p
                  className="mt-1 font-mono text-[12px] tracking-[0.01em] text-[#B0A18C]"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {formatRelativeTime(p.timestamp)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
