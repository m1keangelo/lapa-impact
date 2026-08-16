/**
 * Lightbox (gallery.md §4) — shared full-screen photo viewer, also used by
 * the feed page (transfer proofs, photo entries). Keyboard (Esc / ← / →),
 * swipe (drag-x, 80px threshold), edge arrows on desktop, caption + mono
 * date + gift/update attribution chips. Close restores focus to the
 * element that opened it.
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Link2, Newspaper, X } from 'lucide-react';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatMoney, formatRelativeTime, pickLang, privacyName } from '@/lib/format';
import type { Donation, ImpactUpdate, MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface LightboxPhoto {
  media: MediaItem;
  donation?: Donation;
  update?: ImpactUpdate;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  /** null = closed */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const SWIPE_THRESHOLD = 80;

export default function Lightbox({ photos, index, onClose, onNavigate }: LightboxProps) {
  const { t, lang } = useLanguage();
  const open = index != null && index >= 0 && index < photos.length;
  const current = open ? photos[index] : null;
  const [dir, setDir] = useState<1 | -1>(1);

  /** Navigate + record travel direction for the slide animation. */
  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, photos.length - 1));
      if (index != null && clamped !== index) setDir(clamped > index ? 1 : -1);
      onNavigate(clamped);
    },
    [index, photos.length, onNavigate],
  );

  // Keyboard navigation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index, onClose, go]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && current ? (
        <motion.div
          key="lightbox"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bg p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={pickLang(current.media, 'caption', lang) || t.common.fieldPhoto}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.lightbox.closeAria}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors duration-150 hover:border-border-strong hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev / next — desktop edges */}
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                aria-label={t.lightbox.prevAria}
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  go(index - 1);
                }}
                className={cn(
                  'absolute left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-all duration-150 hover:border-border-strong hover:text-text disabled:opacity-30 md:flex',
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label={t.lightbox.nextAria}
                disabled={index === photos.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  go(index + 1);
                }}
                className="absolute right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-all duration-150 hover:border-border-strong hover:text-text disabled:opacity-30 md:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}

          {/* Content */}
          <div
            className="flex w-full max-w-[960px] flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.img
                  key={current.media.id}
                  src={cloudinaryUrl(current.media.cloudinaryUrl, { width: 1600, crop: 'limit' })}
                  alt={pickLang(current.media, 'caption', lang) || t.common.fieldPhoto}
                  className="mx-auto max-h-[78vh] w-auto max-w-full rounded-card border border-border object-contain"
                  custom={dir}
                  initial={{ opacity: 0, x: 48 * dir, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -32 * dir }}
                  transition={{ duration: 0.25, ease: EASE }}
                  drag={photos.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -SWIPE_THRESHOLD) {
                      go(index + 1);
                    } else if (info.offset.x > SWIPE_THRESHOLD) {
                      go(index - 1);
                    }
                  }}
                />
              </AnimatePresence>
            </div>

            {/* Caption + attribution */}
            <motion.div
              key={`meta-${current.media.id}`}
              className="mt-4 flex w-full max-w-[720px] flex-col items-center gap-2 text-center"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: EASE, delay: 0.05 }}
            >
              {current.media.caption ? (
                <p className="text-base leading-[1.55] text-text">{pickLang(current.media, 'caption', lang)}</p>
              ) : null}
              <p
                className="font-mono text-[12px] tracking-[0.01em] text-text-muted"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatRelativeTime(current.media.timestamp, lang)}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {current.donation ? (
                  <Link
                    to={`/feed#entry-${current.donation.id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sage/50 bg-sage/10 px-3 py-1 text-[12px] font-medium text-sage transition-colors duration-150 hover:bg-sage/20"
                  >
                    <Link2 className="h-3 w-3" />
                    {t.lightbox.fundedA}
                    {privacyName(current.donation.donorName, lang)}
                    {t.lightbox.fundedB} ·{' '}
                    <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(current.donation.amount)}
                    </span>
                  </Link>
                ) : null}
                {current.update ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/50 bg-amber/10 px-3 py-1 text-[12px] font-medium text-amber">
                    <Newspaper className="h-3 w-3" />
                    {t.lightbox.fromUpdate(current.update.title)}
                  </span>
                ) : null}
              </div>
            </motion.div>
          </div>

          {/* Counter */}
          {photos.length > 1 ? (
            <p
              className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[12px] tracking-[0.01em] text-text-muted"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {index + 1} / {photos.length}
            </p>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
