/**
 * Modal — ONE reusable overlay (final doc §49–56): centered dialog on
 * desktop, bottom sheet on mobile. Soft dim, no navigation, no reload,
 * never loses form state underneath. Accessible: role="dialog",
 * aria-modal, Escape closes, focus moves in on open and back out on
 * close, body scroll locked while open.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Visible heading — also the accessible name */
  title: string;
  children: ReactNode;
  /** Wider layout for content-heavy help panels */
  wide?: boolean;
}) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Move focus into the dialog for keyboard/screen-reader users.
    const t0 = window.setTimeout(() => panelRef.current?.focus(), 60);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t0);
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6">
          <m.button
            type="button"
            aria-label={t.common.dismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#111111]/55"
          />
          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: EASE }}
            className={`relative z-10 max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 shadow-2xl outline-none sm:rounded-card ${
              wide ? 'sm:max-w-[560px]' : 'sm:max-w-[440px]'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-[20px] font-medium tracking-[-0.01em] text-text">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.common.dismiss}
                className="-mr-1.5 -mt-1.5 flex h-11 w-11 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
