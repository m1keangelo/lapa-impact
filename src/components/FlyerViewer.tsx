/**
 * FlyerViewer — full-size event flyer overlay. The poster on the page is
 * just the preview; tapping it opens the flyer at full size here. Backdrop
 * click or Esc closes; body scroll locks while open. Shared by the home
 * Event Spotlight and the /event page.
 */
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function FlyerViewer({
  src,
  alt,
  onClose,
}: {
  /** null = closed */
  src: string | null;
  alt: string;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const open = src !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="flyer"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t.lightbox.closeAria}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white/85 transition-colors hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.img
            src={src}
            alt={alt}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="max-h-[86vh] w-auto max-w-full rounded-[10px] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
