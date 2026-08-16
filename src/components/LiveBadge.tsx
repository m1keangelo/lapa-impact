/**
 * LiveBadge (design.md §7.6) — sage dot + caption, shown wherever an
 * onSnapshot listener is active. Static dot: icons never animate
 * (TYPOGRAPHIC MOTION ONLY).
 */
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  label?: string;
  className?: string;
  /** Lighter sage for dark photographic backdrops (hero). */
  onDark?: boolean;
}

export default function LiveBadge({ label, className, onDark }: LiveBadgeProps) {
  const { t } = useLanguage();
  const text = label ?? t.common.live;
  const tone = onDark ? '#8FBE9F' : undefined;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1',
        className,
      )}
    >
      <span
        className="inline-flex h-2 w-2 rounded-full bg-sage"
        style={tone ? { backgroundColor: tone } : undefined}
        aria-hidden
      />
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage"
        style={tone ? { color: tone } : undefined}
      >
        {text}
      </span>
    </span>
  );
}
