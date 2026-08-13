/**
 * EmptyState (design.md §7.7) — centered icon + Fraunces title + caption +
 * optional CTA. Used for empty feed filters, no photos, no donations yet.
 */
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border px-6 py-14 text-center',
        className,
      )}
    >
      <Icon className="h-12 w-12 text-text-faint" strokeWidth={1.25} />
      <h3 className="font-display text-xl font-medium text-text">{title}</h3>
      {body ? (
        <p className="max-w-[40ch] text-[13px] font-medium leading-[1.4] tracking-[0.01em] text-text-muted">
          {body}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 rounded-[10px] bg-amber px-4 py-2 text-sm font-semibold text-[#1A130B] transition-transform duration-150 ease-calm hover:bg-amber-soft active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
