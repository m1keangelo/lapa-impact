/**
 * Section 3 — "Last logged": the 8 most recent docs across donations,
 * transfers, updates and media, via the same bounded onSnapshot listeners
 * donors see (useCombinedFeed). Each row shows the feed rendering plus an
 * admin-only mono doc ID. New writes insert with the standard live-insert
 * animation (slide 16px + fade, temporary amber left border).
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, HandCoins, Newspaper, Send } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { useCombinedFeed } from '@/hooks/useFeed';
import { formatMoney, formatRelativeTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { FeedEntry } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function entryContent(entry: FeedEntry): {
  icon: typeof HandCoins;
  iconCls: string;
  title: string;
  meta: string;
  amount?: { text: string; cls: string };
} {
  switch (entry.kind) {
    case 'donation':
      return {
        icon: HandCoins,
        iconCls: 'text-amber',
        title: 'Gift recorded',
        meta: [entry.donation.donorName ?? 'A donor', entry.donation.note]
          .filter(Boolean)
          .join(' · '),
        amount: { text: `+${formatMoney(entry.donation.amount)}`, cls: 'text-amber' },
      };
    case 'transfer':
      return {
        icon: Send,
        iconCls: 'text-terra',
        title: 'Transfer out',
        meta: [entry.transfer.recipient, entry.transfer.purpose]
          .filter(Boolean)
          .join(' · '),
        amount: { text: `−${formatMoney(entry.transfer.amount)}`, cls: 'text-terra' },
      };
    case 'update':
      return {
        icon: Newspaper,
        iconCls: 'text-sage',
        title: entry.update.title,
        meta: entry.update.body.slice(0, 90),
      };
    case 'photo':
      return {
        icon: Camera,
        iconCls: 'text-text',
        title: entry.media.caption || 'Photo from the field',
        meta: 'Published to the gallery',
      };
  }
}

export default function RecentActivity() {
  const { items, status } = useCombinedFeed(8);

  return (
    <section className="mt-10">
      <h2 className="font-display text-[24px] font-medium tracking-[-0.01em] text-text md:text-[32px]">
        Last logged
      </h2>
      <p className="mt-1 text-[13px] font-medium tracking-[0.01em] text-text-muted">
        The same live list your donors see — confirms every write landed.
      </p>

      {status === 'empty' ? (
        <EmptyState
          className="mt-5"
          icon={HandCoins}
          title="Nothing logged yet"
          body="Record your first gift, transfer, update or photo above — it appears here within a second."
        />
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {items.map((entry) => {
              const c = entryContent(entry);
              const Icon = c.icon;
              return (
                <motion.li
                  key={`${entry.kind}-${entry.id}`}
                  layout="position"
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className={cn(
                    'flex items-center gap-3.5 rounded-card border border-border bg-surface px-4 py-3.5',
                    'border-l-2 border-l-amber/70',
                  )}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2">
                    <Icon className={cn('h-4.5 w-4.5 h-[18px] w-[18px]', c.iconCls)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium text-text">{c.title}</p>
                    <p className="truncate text-[12px] font-medium tracking-[0.01em] text-text-muted">
                      {c.meta || '—'}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-text-faint">
                      {entry.kind}/{entry.id}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    {c.amount && (
                      <p
                        className={cn('font-mono text-[14px] font-medium', c.amount.cls)}
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {c.amount.text}
                      </p>
                    )}
                    <p className="font-mono text-[11px] text-text-faint">
                      {formatRelativeTime(entry.ts)}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
