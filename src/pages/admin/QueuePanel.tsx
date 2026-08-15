/**
 * Review queue (spec §13–15, §17).
 *
 * Volunteer reports sit here until an admin approves (publishes to the
 * public feed as an updates/{id} doc + media docs, chained to the linked
 * purchase) or returns them with a note. The pace chip keeps publishing
 * honest and human: 2–3 strong updates per hour, never a photo dump.
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { CheckCircle2, Inbox, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { CAMPAIGN } from '@/lib/campaign';
import { db } from '@/lib/firebase';
import { formatMoney, formatShortDate, pickLang, toMillis } from '@/lib/format';
import type { FieldReport, Transfer } from '@/lib/types';
import { useReportQueue } from '@/hooks/useFieldReports';
import { usePublicFeed } from '@/hooks/usePublicFeed';
import { cn } from '@/lib/utils';
import { inputCls } from './formUtils';
import { logAudit } from './writeUtils';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function locationLabel(id: string, lang: 'en' | 'es'): string {
  const loc = CAMPAIGN.locations.find((l) => l.id === id);
  return loc ? (lang === 'es' ? loc.es : loc.en) : id;
}

function QueueCard({
  report,
  transfersById,
  reviewerName,
}: {
  report: FieldReport;
  transfersById: Map<string, Transfer>;
  reviewerName: string;
}) {
  const { t, lang } = useLanguage();
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const linked = report.linkedTransferId ? transfersById.get(report.linkedTransferId) : undefined;

  const approve = async () => {
    if (!db || busy) return;
    setBusy(true);
    try {
      const batch = writeBatch(db);
      // 1. The public update — chained to the purchase it proves.
      const updateRef = doc(collection(db, 'updates'));
      batch.set(updateRef, {
        title: report.note || report.delivered || '',
        body: report.delivered ? report.delivered : '',
        metrics: {},
        timestamp: report.happenedAt,
        location: report.location,
        category: 'field',
        missionDay: report.missionDay,
        authorName: report.authorName,
        ...(report.linkedTransferId ? { linkedTransferId: report.linkedTransferId } : {}),
        sourceReportId: report.id,
      });
      // 2. Each photo becomes a media doc linked to the update.
      const mediaIds: string[] = [];
      for (const url of report.photoUrls) {
        const mediaRef = doc(collection(db, 'media'));
        mediaIds.push(mediaRef.id);
        batch.set(mediaRef, {
          cloudinaryUrl: url,
          thumbnailUrl: url,
          caption: report.note || report.delivered || '',
          timestamp: report.happenedAt,
          updateId: updateRef.id,
        });
      }
      if (mediaIds.length > 0) batch.update(updateRef, { mediaIds });
      // 3. Mark the report approved.
      batch.update(doc(db, 'fieldReports', report.id), {
        status: 'approved',
        reviewedBy: reviewerName,
        reviewedAt: serverTimestamp(),
        publishedUpdateId: updateRef.id,
      });
      await batch.commit();
      void logAudit(db, 'fieldreport.approve', { reportId: report.id, updateId: updateRef.id });
      toast.success(t.ops.queue.approvedToast);
    } catch (err) {
      console.error('[QueueCard] approve failed:', err);
      toast.error(t.common.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!db || busy) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, 'fieldReports', report.id), {
        status: 'rejected',
        reviewedBy: reviewerName,
        reviewedAt: serverTimestamp(),
        ...(rejectReason.trim() ? { rejectReason: rejectReason.trim() } : {}),
      });
      void logAudit(db, 'fieldreport.reject', { reportId: report.id });
      toast.success(t.ops.queue.rejectedToast);
    } catch (err) {
      console.error('[QueueCard] reject failed:', err);
      toast.error(t.common.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
      transition={{ duration: 0.35, ease: EASE }}
      className="rounded-card border border-border bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-text-faint">
            {locationLabel(report.location, lang)} · {formatShortDate(toMillis(report.happenedAt), lang)} ·{' '}
            {t.ops.queue.by(report.authorName)}
          </p>
          <p className="mt-1.5 text-[15px] font-medium leading-[1.45] text-text">{report.note}</p>
          {report.delivered ? (
            <p className="mt-1 text-[13px] font-medium text-sage">{report.delivered}</p>
          ) : null}
          {linked ? (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-terra/40 bg-terra/10 px-2.5 py-1 text-[12px] font-medium text-terra">
              {t.ops.queue.linkedPurchase}: {formatMoney(linked.amount)} ·{' '}
              {pickLang(linked, 'purpose', lang)}
            </p>
          ) : null}
        </div>
      </div>

      {report.photoUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {report.photoUrls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer">
              <img
                src={url}
                alt=""
                className="aspect-square w-full rounded-[8px] border border-border object-cover"
              />
            </a>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => void approve()}
          disabled={busy}
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-[10px] bg-amber text-[14px] font-semibold text-white transition-colors hover:bg-amber-soft disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {t.ops.queue.approve}
        </button>
        <button
          type="button"
          onClick={() => setRejectOpen((v) => !v)}
          disabled={busy}
          className="flex h-10 items-center justify-center gap-2 rounded-[10px] border border-border bg-surface px-4 text-[14px] font-semibold text-text-muted transition-colors hover:text-danger disabled:opacity-60"
        >
          <Undo2 className="h-4 w-4" /> {t.ops.queue.reject}
        </button>
      </div>

      {rejectOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.25, ease: EASE }}
          className="overflow-hidden"
        >
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t.ops.queue.rejectPh}
              className={cn(inputCls, 'h-10 text-[13px]')}
            />
            <button
              type="button"
              onClick={() => void reject()}
              disabled={busy}
              className="h-10 shrink-0 rounded-[10px] border border-danger/50 bg-danger/10 px-4 text-[13px] font-semibold text-danger"
            >
              {t.ops.queue.reject}
            </button>
          </div>
        </motion.div>
      )}
    </motion.article>
  );
}

export default function QueuePanel({ reviewerName }: { reviewerName: string }) {
  const { t } = useLanguage();
  const { reports, loading } = useReportQueue();
  const feed = usePublicFeed();

  const transfersById = useMemo(
    () => new Map(feed.transfers.map((tr) => [tr.id, tr])),
    [feed.transfers],
  );

  // Pace: approved reports published in the last 60 minutes.
  const publishedLastHour = useMemo(() => {
    const cutoff = Date.now() - 3600_000;
    return feed.updates.filter((u) => u.sourceReportId && toMillis(u.timestamp) >= cutoff).length;
  }, [feed.updates]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-surface-2 px-4 py-3">
        <p className="text-[13px] font-semibold text-text">
          {t.ops.queue.pace(publishedLastHour)}
        </p>
        <p className="text-[12px] font-medium text-text-faint">{t.ops.queue.paceHint}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-card bg-surface-2" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface px-6 py-12 text-center">
          <Inbox className="h-8 w-8 text-text-faint" strokeWidth={1.5} />
          <p className="text-[14px] font-medium text-text-muted">{t.ops.queue.empty}</p>
        </div>
      ) : (
        reports.map((r) => (
          <QueueCard
            key={r.id}
            report={r}
            transfersById={transfersById}
            reviewerName={reviewerName}
          />
        ))
      )}
    </div>
  );
}
