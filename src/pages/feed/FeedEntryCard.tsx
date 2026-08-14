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
  MapPin,
  Newspaper,
  Receipt,
  type LucideIcon,
} from 'lucide-react';
import { cloudinaryUrl } from '@/lib/cloudinary';
import { useLanguage } from '@/i18n/LanguageContext';
import { CAMPAIGN } from '@/lib/campaign';
import { formatMoney, formatShortDate, pickLang, pickMetrics, privacyName } from '@/lib/format';
import type { FeedEntry, MediaItem, Transfer } from '@/lib/types';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Resolve a campaign location id to its display name. */
function locationLabel(id: string | undefined, lang: 'en' | 'es'): string | null {
  if (!id) return null;
  const loc = CAMPAIGN.locations.find((l) => l.id === id);
  if (loc) return lang === 'es' ? loc.es : loc.en;
  return id;
}

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
  /** purchase lookup for the proof chain (update → linked purchase) */
  transfersById?: Map<string, Transfer>;
  onOpenPhoto?: (media: MediaItem) => void;
  onOpenProof?: (url: string, caption: string) => void;
}

export default function FeedEntryCard({
  entry,
  fresh,
  matched,
  transfersById,
  onOpenPhoto,
  onOpenProof,
}: FeedEntryCardProps) {
  const [open, setOpen] = useState(false);
  const { t, lang } = useLanguage();
  const { icon: Icon, color } = VARIANT_ICON[entry.kind];

  let title: ReactNode = null;
  let meta: string | null = null;
  let note: string | null = null;
  let amount: number | null = null;
  const ts = entry.ts;
  let expandable = false;

  // People + proof (one-pass master §15–16): human sentence → amount →
  // "Donation · Aug 14" → details. Never a bank statement.
  if (entry.kind === 'donation') {
    const d = entry.donation;
    amount = d.amount;
    title = t.feedEntry.donationTitle(
      privacyName(d.donorName, lang),
      lang === 'es' ? CAMPAIGN.countryEs : CAMPAIGN.country,
    );
    meta = t.feedEntry.metaDonation(formatShortDate(ts, lang));
    note = d.note ? pickLang(d, 'note', lang) : null;
  } else if (entry.kind === 'transfer') {
    const tr = entry.transfer;
    amount = tr.amount;
    title = t.feedEntry.transferTitle(
      pickLang(tr, 'recipient', lang),
      pickLang(tr, 'purpose', lang),
    );
    meta = t.feedEntry.metaTransfer(formatShortDate(ts, lang));
    expandable = true;
  } else if (entry.kind === 'update') {
    title = pickLang(entry.update, 'title', lang);
    meta = null;
    expandable = true;
  } else {
    title = pickLang(entry.media, 'caption', lang) || t.feedEntry.newPhoto;
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
            {fresh && entry.kind === 'donation' ? (
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
                {t.feedEntry.justShowedUp}
              </span>
            ) : null}
            <span className="block text-[15px] font-medium leading-snug text-text">{title}</span>
            {amount != null ? (
              <span
                className="mt-0.5 block text-[15px] font-semibold text-text"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatMoney(amount)}
              </span>
            ) : null}
            {meta ? (
              <span className="mt-0.5 block text-[12px] font-medium tracking-[0.01em] text-text-muted">
                {meta}
              </span>
            ) : null}
            {note ? (
              <span className="mt-1 block text-[13px] italic leading-[1.5] text-text-muted">
                “{note}”
              </span>
            ) : null}

            {/* Update: clamped body preview + metric mini-chips */}
            {entry.kind === 'update' ? (
              <>
                <span className="mt-1 line-clamp-2 block text-[15px] leading-[1.55] text-text-muted">
                  {entry.update.body}
                </span>
                {Object.keys(pickMetrics(entry.update, lang)).length > 0 ? (
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(pickMetrics(entry.update, lang)).map(([k, v]) => (
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
                    alt={pickLang(entry.media, 'caption', lang) || t.common.fieldPhoto}
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

            {/* Location chip (transfer + update) */}
            {entry.kind === 'transfer' && locationLabel(entry.transfer.location, lang) ? (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-text-muted">
                <MapPin className="h-3 w-3 text-terra" strokeWidth={1.75} />
                {locationLabel(entry.transfer.location, lang)}
              </span>
            ) : null}
            {entry.kind === 'update' && locationLabel(entry.update.location, lang) ? (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-text-muted">
                <MapPin className="h-3 w-3 text-sage" strokeWidth={1.75} />
                {locationLabel(entry.update.location, lang)}
              </span>
            ) : null}

            {/* Transfer: proof + receipt chips */}
            {entry.kind === 'transfer' && (entry.transfer.proofUrl || entry.transfer.receiptUrl) ? (
              <span className="mt-2 flex flex-wrap gap-1.5">
                {entry.transfer.proofUrl ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProof?.(entry.transfer.proofUrl!, t.feedEntry.proofCaption(pickLang(entry.transfer, 'purpose', lang)));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-sage/50 bg-sage/10 px-2.5 py-1 text-[11px] font-semibold text-sage transition-colors duration-150 hover:bg-sage/20"
                  >
                    <FileCheck className="h-3 w-3" />
                    {t.feedEntry.proof}
                  </button>
                ) : null}
                {entry.transfer.receiptUrl ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProof?.(entry.transfer.receiptUrl!, t.feedEntry.receiptCaption(entry.transfer.vendor || pickLang(entry.transfer, 'recipient', lang)));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-terra/50 bg-terra/10 px-2.5 py-1 text-[11px] font-semibold text-terra transition-colors duration-150 hover:bg-terra/20"
                  >
                    <Receipt className="h-3 w-3" />
                    {t.feedEntry.viewReceipt}
                  </button>
                ) : null}
              </span>
            ) : null}

            {expandable ? (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-amber">
                {t.feedEntry.viewDetails}
                <ChevronDown
                  className={cn(
                    'h-3.5 w-3.5 transition-transform duration-300 ease-calm',
                    open && 'rotate-180',
                  )}
                />
              </span>
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
                      <dd className="inline text-text-muted">{pickLang(entry.transfer, 'recipient', lang)}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow inline">{t.feedEntry.purpose} · </dt>
                      <dd className="inline text-text-muted">{pickLang(entry.transfer, 'purpose', lang)}</dd>
                    </div>
                    {entry.transfer.vendor ? (
                      <div>
                        <dt className="eyebrow inline">{t.feedEntry.vendor} · </dt>
                        <dd className="inline text-text-muted">{entry.transfer.vendor}</dd>
                      </div>
                    ) : null}
                    {locationLabel(entry.transfer.location, lang) ? (
                      <div>
                        <dt className="eyebrow inline">{t.feedEntry.locationLabel} · </dt>
                        <dd className="inline text-text-muted">{locationLabel(entry.transfer.location, lang)}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
                {entry.kind === 'update' ? (
                  <>
                    <p className="text-sm leading-[1.55] text-text-muted">{pickLang(entry.update, 'body', lang)}</p>
                    {(() => {
                      const linked = entry.update.linkedTransferId
                        ? transfersById?.get(entry.update.linkedTransferId)
                        : undefined;
                      return (
                        <div className="mt-2 space-y-1.5">
                          {linked ? (
                            <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-terra">
                              <Receipt className="h-3 w-3" />
                              {t.feedEntry.chainPurchase(formatMoney(linked.amount))}
                              {linked.receiptUrl ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenProof?.(linked.receiptUrl!, t.feedEntry.receiptCaption(linked.vendor || pickLang(linked, 'recipient', lang)))}
                                  className="underline underline-offset-2"
                                >
                                  {t.feedEntry.viewReceipt}
                                </button>
                              ) : null}
                            </p>
                          ) : null}
                          {entry.update.authorName ? (
                            <p className="text-[12px] font-medium text-text-muted">
                              {t.feedEntry.reportedBy(entry.update.authorName)}
                            </p>
                          ) : null}
                        </div>
                      );
                    })()}
                  </>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
