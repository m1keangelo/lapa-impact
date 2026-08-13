/**
 * Impact Section 4a — "Your gifts" (dashboard.md §4a). Donation history for
 * this donor: FeedItem donation rows with live insert animation (new gifts
 * slide in at the top), a count badge, loading skeletons and a HandHeart
 * empty state.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { HandHeart } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import FeedItem from '@/components/FeedItem';
import { useLanguage } from '@/i18n/LanguageContext';
import type { Donation, LiveStatus } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface GiftHistoryProps {
  donations: Donation[];
  status: LiveStatus;
  reducedMotion: boolean;
}

export default function GiftHistory({ donations, status, reducedMotion }: GiftHistoryProps) {
  const { t } = useLanguage();
  return (
    <section aria-label={t.giftHistory.sectionAria}>
      <div className="flex items-center gap-3">
        <h2 className="font-display text-2xl font-medium leading-[1.2] tracking-[-0.01em] text-text md:text-[32px]">
          {t.giftHistory.title}
        </h2>
        {status !== 'loading' && donations.length > 0 ? (
          <span
            className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-[12px] font-medium text-text-muted"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {donations.length}
          </span>
        ) : null}
      </div>

      <div className="mt-5">
        {status === 'loading' ? (
          <div className="space-y-3" aria-label={t.giftHistory.loadingAria}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-2" />
                <div className="flex-1">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-surface-2" />
                  <div className="mt-2 h-3 w-48 animate-pulse rounded bg-surface-2" />
                </div>
                <div className="h-3.5 w-16 animate-pulse rounded bg-surface-2" />
              </div>
            ))}
          </div>
        ) : donations.length === 0 ? (
          <EmptyState
            icon={HandHeart}
            title={t.giftHistory.emptyTitle}
            body={t.giftHistory.emptyBody}
          />
        ) : (
          <motion.ul layout="position" className="space-y-3">
            <AnimatePresence initial={false}>
              {donations.map((d) => (
                <motion.li
                  key={d.id}
                  layout="position"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reducedMotion ? 0.2 : 0.45, ease: EASE }}
                >
                  <FeedItem
                    variant="donation"
                    title={t.giftHistory.giftTitle}
                    meta={d.note}
                    amount={d.amount}
                    timestamp={d.timestamp}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </section>
  );
}
