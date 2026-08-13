/**
 * FeedEntryCard (feed.md §3) — rich ledger entry for the public stream.
 * Four variants: donation (amber), transfer (terra, proof chip), update
 * (sage, metrics mini-chips, expandable body), photo (cream, 16:9 thumb,
 * "matched" chip). Live-pushed entries get the signature treatment: slide
 * down + 1px amber left border that flashes and fades over 2s.
 */
import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRightToLine,
  Camera,
  ChevronDown,
  FileCheck,
  HandCoins,
  Link2,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatMoney, formatRelativeTime, privacyName } from '@/lib/format';
import type { FeedEntry, MediaItem } from '@/lib/types';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const VARIANT_ICON: Record<FeedEntry['kind'], { icon: LucideIcon; color: string }> = {
  donation: { icon: HandCoins, color: 'var(--amber)' },
  transfer: { icon: ArrowRightToLine, color: 'var(--terra)' },
  update: { icon: Newspaper, color: 'var(--sage)' },
  photo: { icon: Camera, color: 'var(--text)' },
};

interface FeedEntryCardProps {
  entry: FeedEntry;
  /** live-pushed after initial load — flash amber */
  fresh: boolean;
  /** whether a photo entry is linked to a donation or update */
  matched?: boolean;
  onOpenPhoto?: (media: MediaItem) => void;
  onOpenProof?: (url: string, caption: string) => void;
}

export default function FeedEntryCard({
  entry,
  fresh,
  matched,
  onOpenPhoto,
  onOpenProof,
}: FeedEntryCardProps) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useLanguage();
  const { icon: Icon, color } = VARIANT_ICON[entry.kind];

  let title: ReactNode = null;
  let meta: string | null = null;
  let amount: number | null = null;
  const ts = entry.ts;
  let expandable = false;

  if (entry.kind === 'donation') {
    const d = entry.donation;
    amount = d.amount;
    title = (
      <>
        {t.feedEntry.gave(privacyName(d.donorName, lang))}{' '}
        <span className="font-mono font-medium text-amber" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(d.amount)}
        </span>
      </>
    );
    meta = d.note ?? null;
  } else if (entry.kind === 'transfer') {
    const tr = entry.transfer;
    amount = tr.amount;
    title = (
      <>
        <span className="font-mono font-medium text-terra" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatMoney(tr.amount)}
        </span>{' '}
        {t.feedEntry.sentToField}
      </>
    );
    meta = t.feedEntry.transferMeta(tr.recipient, tr.purpose);
    expandable = true;
  } else if (entry.kind === 'update') {
    title = entry.update.title;
    meta = null;
    expandable = true;
  } else {
    title = entry.media.caption || t.feedEntry.newPhoto;
  }

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.45, ease: EASE, layout: { duration: 0.3, ease: EASE } }}
      className="relative"
    >
      {/* Live-insert amber border flash (fades over 2s) */}
      {fresh ? (
        <motion.span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[3px] rounded-l-card bg-amber"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      ) : null}

      <div
        className={cn(
          'rounded-card border border-border bg-surface transition-colors duration-200 ease-calm',
          open ? 'bg-surface-2' : 'hover:bg-surface-2',
        )}
      >
        <div
          role={expandable ? 'button' : undefined}
          tabIndex={expandable ? 0 : undefined}
          onClick={() => expandable && setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (expandable && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen((o) => !o);
            }
          }}
          className={cn(
            'flex w-full items-start gap-3 px-4 py-3 text-left',
            expandable && 'cursor-pointer active:bg-surface-3',
          )}
        >
          <span
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2"
            aria-hidden
          >
            <Icon className="h-[18px] w-[18px]" style={{ color }} strokeWidth={1.75} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-medium leading-snug text-text">{title}</span>
            {meta ? (
              <span className="mt-0.5 block truncate text-[12px] font-medium tracking-[0.01em] text-text-muted">
                {meta}
              </span>
            ) : null}

            {/* Update: clamped body preview + metric mini-chips */}
            {entry.kind === 'update' ? (
              <>
                <span className="mt-1 line-clamp-2 block text-[15px] leading-[1.55] text-text-muted">
                  {entry.update.body}
                </span>
                {Object.keys(entry.update.metrics ?? {}).length > 0 ? (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(entry.update.metrics).map(([k, v]) => (
                      <span
                        key={k}
                        className="rounded-full border border-sage/40 px-2 py-0.5 font-mono text-[11px] text-sage"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                      >
                        {k} {typeof v === 'number' && v > 0 ? `+${v}` : v}
                      </span>
                    ))}
                  </span>
                ) : null}
              </>
            ) : null}

            {/* Photo: inline 16:9 thumb */}
            {entry.kind === 'photo' ? (
              <span className="mt-2 block">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenPhoto?.(entry.media);
                  }}
                  className="relative block w-full cursor-zoom-in overflow-hidden rounded-[12px] border border-border"
                  aria-label={t.common.openPhoto}
                >
                  <img
                    src={cloudinaryUrl(entry.media.thumbnailUrl || entry.media.cloudinaryUrl, {
                      width: 640,
                      crop: 'limit',
                    })}
                    alt={entry.media.caption || t.common.fieldPhoto}
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform duration-500 ease-calm hover:scale-[1.03]"
                  />
                </button>
                {matched ? (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-sage/40 px-2 py-0.5 text-[11px] font-semibold text-sage">
                    <Link2 className="h-3 w-3" />
                    {t.feedEntry.matched}
                  </span>
                ) : null}
              </span>
            ) : null}

            {/* Transfer: proof chip */}
            {entry.kind === 'transfer' && entry.transfer.proofUrl ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenProof?.(entry.transfer.proofUrl!, t.feedEntry.proofCaption(entry.transfer.purpose));
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-sage/50 bg-sage/10 px-2.5 py-1 text-[11px] font-semibold text-sage transition-colors duration-150 hover:bg-sage/20"
              >
                <FileCheck className="h-3 w-3" />
                {t.feedEntry.proof}
              </button>
            ) : null}
          </span>

          <span className="flex shrink-0 flex-col items-end gap-0.5">
            {amount != null ? (
              <span
                className="font-mono text-sm font-medium"
                style={{ color, fontVariantNumeric: 'tabular-nums' }}
              >
                {entry.kind === 'transfer' ? '−' : '+'}
                {formatMoney(amount)}
              </span>
            ) : null}
            <span
              className="font-mono text-[12px] tracking-[0.01em] text-text-muted"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatRelativeTime(ts, lang)}
            </span>
            {expandable ? (
              <ChevronDown
                className={cn(
                  'mt-1 h-4 w-4 text-text-faint transition-transform duration-300 ease-calm',
                  open && 'rotate-180',
                )}
              />
            ) : null}
          </span>
        </div>

        {/* Expanded detail */}
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              key="detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-4 py-3 pl-[68px]">
                {entry.kind === 'transfer' ? (
                  <dl className="space-y-1.5 text-sm leading-[1.55]">
                    <div>
                      <dt className="eyebrow inline">{t.feedEntry.recipient} · </dt>
                      <dd className="inline text-text-muted">{entry.transfer.recipient}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow inline">{t.feedEntry.purpose} · </dt>
                      <dd className="inline text-text-muted">{entry.transfer.purpose}</dd>
                    </div>
                  </dl>
                ) : null}
                {entry.kind === 'update' ? (
                  <p className="text-sm leading-[1.55] text-text-muted">{entry.update.body}</p>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
