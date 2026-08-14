/**
 * Impact Section 4b — "From the field" (dashboard.md §4b). A 2-col grid of
 * photos matched to the donor's own gifts (media.donationId ∈ their
 * donation ids), max 4 tiles, hover caption scrim, tap opens a lightbox
 * with the caption and a sage "Funded in part by your gift" chip.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { pickLang } from '@/lib/format';
import type { LiveStatus, MediaItem } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface MatchedPhotosProps {
  photos: MediaItem[];
  status: LiveStatus;
  donationIds: string[];
  reducedMotion: boolean;
}

export default function MatchedPhotos({
  photos,
  status,
  donationIds,
  reducedMotion,
}: MatchedPhotosProps) {
  const [active, setActive] = useState<MediaItem | null>(null);
  const { t, lang } = useLanguage();
  const shown = photos.slice(0, 4);

  // Escape closes; body scroll locked while the lightbox is open.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [active]);

  const fundedByYou = (m: MediaItem) =>
    Boolean(m.donationId && donationIds.includes(m.donationId));

  return (
    <section aria-label={t.matchedPhotos.sectionAria}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-medium leading-[1.2] tracking-[-0.01em] text-text md:text-[32px]">
          {t.matchedPhotos.title}
        </h2>
        <Link
          to="/gallery"
          className="shrink-0 text-sm font-semibold text-amber transition-colors hover:text-amber-soft"
        >
          {t.matchedPhotos.all}
        </Link>
      </div>

      <div className="mt-5">
        {status === 'loading' ? (
          <div className="grid grid-cols-2 gap-3" aria-label={t.matchedPhotos.loadingAria}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-surface-2" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border px-6 py-12 text-center">
            <img src="/empty-photos.svg" alt="" className="h-20 w-auto opacity-80" />
            <h3 className="font-display text-xl font-medium text-text">{t.matchedPhotos.emptyTitle}</h3>
            <p className="max-w-[36ch] text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted">
              {t.matchedPhotos.emptyBody}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {shown.map((m, i) => (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => setActive(m)}
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, clipPath: 'inset(12% 12% 12% 12%)' }
                }
                whileInView={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' }}
                viewport={{ amount: 0.15, once: true }}
                transition={{
                  delay: reducedMotion ? 0 : i * 0.09,
                  duration: reducedMotion ? 0.2 : 0.5,
                  ease: EASE,
                }}
                aria-label={t.common.openPhotoCaption(pickLang(m, 'caption', lang))}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface-2"
              >
                <img
                  src={m.thumbnailUrl || m.cloudinaryUrl}
                  alt={pickLang(m, 'caption', lang)}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 ease-calm group-hover:scale-[1.04]"
                />
                <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2.5 pt-8 text-left opacity-0 transition-all duration-200 ease-calm group-hover:translate-y-0 group-hover:opacity-100">
                  <span className="line-clamp-2 text-[12px] font-medium leading-[1.35] text-[#F3EAD9]">
                    {pickLang(m, 'caption', lang)}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active ? (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.25 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
            aria-label={pickLang(active, 'caption', lang)}
          >
            <motion.figure
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.92 }}
              transition={{ duration: reducedMotion ? 0.15 : 0.25, ease: EASE }}
              className="w-full max-w-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-card border border-border-strong bg-surface">
                <img
                  src={active.cloudinaryUrl || active.thumbnailUrl}
                  alt={pickLang(active, 'caption', lang)}
                  className="max-h-[72dvh] w-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  aria-label={t.matchedPhotos.closePhoto}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-[#F3EAD9] transition-colors hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <figcaption className="mt-3 flex flex-col items-start gap-2 px-1">
                <p className="text-[14px] font-medium leading-[1.5] text-[#F3EAD9]">
                  {pickLang(active, 'caption', lang)}
                </p>
                {fundedByYou(active) ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sage/40 bg-sage/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">
                    {t.matchedPhotos.funded}
                  </span>
                ) : null}
              </figcaption>
            </motion.figure>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
