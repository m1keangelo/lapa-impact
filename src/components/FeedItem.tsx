/**
 * FeedItem (design.md §7.4) — horizontal row card with a 40px icon disc,
 * content column and right-aligned mono timestamp. Tappable to expand a
 * detail area when `detail` is provided. Variants color the icon:
 * donation (amber), transfer (terra), update (sage), photo (cream).
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRightToLine,
  Camera,
  ChevronDown,
  HandCoins,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatMoney, formatRelativeTime } from '@/lib/format';
import type { TimestampLike } from '@/lib/types';
import { cn } from '@/lib/utils';

export type FeedItemVariant = 'donation' | 'transfer' | 'update' | 'photo';

const VARIANT_META: Record<FeedItemVariant, { icon: LucideIcon; color: string }> = {
  donation: { icon: HandCoins, color: 'var(--amber)' },
  transfer: { icon: ArrowRightToLine, color: 'var(--terra)' },
  update: { icon: Newspaper, color: 'var(--sage)' },
  photo: { icon: Camera, color: 'var(--text)' },
};

interface FeedItemProps {
  variant: FeedItemVariant;
  title: string;
  meta?: string;
  /** integer cents; rendered in variant color, mono */
  amount?: number;
  timestamp: TimestampLike;
  /** expandable detail body; when present the row is tappable */
  detail?: string;
  className?: string;
}

export default function FeedItem({
  variant,
  title,
  meta,
  amount,
  timestamp,
  detail,
  className,
}: FeedItemProps) {
  const [open, setOpen] = useState(false);
  const { lang } = useLanguage();
  const { icon: Icon, color } = VARIANT_META[variant];
  const expandable = Boolean(detail);

  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface transition-colors duration-200 ease-calm',
        open ? 'bg-surface-2' : 'hover:bg-surface-2',
        className,
      )}
    >
      <button
        type="button"
        disabled={!expandable}
        onClick={() => expandable && setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center gap-3 px-4 py-3 text-left',
          expandable ? 'active:bg-surface-3' : 'cursor-default',
        )}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2"
          aria-hidden
        >
          <Icon className="h-[18px] w-[18px]" style={{ color }} strokeWidth={1.75} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium leading-snug text-text">
            {title}
          </span>
          {meta ? (
            <span className="mt-0.5 block truncate text-[12px] font-medium tracking-[0.01em] text-text-muted">
              {meta}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 flex-col items-end gap-0.5">
          {amount != null ? (
            <span
              className="font-mono text-sm font-medium"
              style={{ color, fontVariantNumeric: 'tabular-nums' }}
            >
              {variant === 'transfer' ? '−' : '+'}
              {formatMoney(amount)}
            </span>
          ) : null}
          <span
            className="font-mono text-[12px] tracking-[0.01em] text-text-muted"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatRelativeTime(timestamp, lang)}
          </span>
        </span>

        {expandable ? (
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-text-faint transition-transform duration-300 ease-calm',
              open && 'rotate-180',
            )}
          />
        ) : null}
      </button>

      <AnimatePresence initial={false}>
        {open && detail ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="border-t border-border px-4 py-3 pl-[68px] text-sm leading-[1.55] text-text-muted">
              {detail}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
