/**
 * PreviewChip — the obvious "this is not real campaign activity yet"
 * indicator (final doc §6). Shown wherever demo/preview content appears
 * so preview content can never be mistaken for the real feed.
 */
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

export default function PreviewChip({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-amber/60 bg-amber-glow px-3.5 py-1.5 text-[11px] font-bold tracking-[0.12em] text-amber',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {t.publicMode.previewChip}
    </span>
  );
}
