/**
 * LiveBadge (design.md §7.6) — sage pulsing dot + caption, shown wherever
 * an onSnapshot listener is active.
 */
import { cn } from '@/lib/utils';

interface LiveBadgeProps {
  label?: string;
  className?: string;
}

export default function LiveBadge({ label = 'LIVE', className }: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1',
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-sage" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-sage" />
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sage">
        {label}
      </span>
    </span>
  );
}
