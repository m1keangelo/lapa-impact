/**
 * Field volunteer console (spec §12–14).
 *
 * Volunteers report what happened on the ground: location, when, a short
 * note, up to 4 real photos, an optional link to the purchase their work
 * delivers on. Nothing publishes directly — every report lands in the
 * review queue as status 'submitted'. Below the form, the volunteer sees
 * their own submissions with their review status.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import {
  addDoc,
  collection,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { CheckCircle2, Clock, ImagePlus, Loader2, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from 'firebase/auth';
import { useLanguage } from '@/i18n/LanguageContext';
import { cloudinaryReady, uploadToCloudinary } from '@/lib/cloudinary';
import { CAMPAIGN } from '@/lib/campaign';
import { db } from '@/lib/firebase';
import { formatMoney, formatShortDate, pickLang, toMillis } from '@/lib/format';
import { missionDay } from '@/lib/mission';
import type { FieldReport, Transfer } from '@/lib/types';
import { useMyReports } from '@/hooks/useFieldReports';
import { cn } from '@/lib/utils';
import { Field, SubmitButton } from './fields';
import { inputCls, textareaCls, type SaveState } from './formUtils';
import { logAudit, nowLocalInputValue } from './writeUtils';

const MAX_PHOTOS = 4;
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

interface UploadedPhoto {
  url: string;
}

/** Recent purchases the volunteer can link their report to. */
function useRecentTransfers(): Transfer[] {
  const [items, setItems] = useState<Transfer[]>([]);
  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'transfers'), orderBy('timestamp', 'desc'), fbLimit(20));
    const unsub = onSnapshot(
      q,
      (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transfer)),
      (err) => console.warn('[useRecentTransfers] failed:', err),
    );
    return unsub;
  }, []);
  return items;
}

export default function FieldReportForm({ user }: { user: User }) {
  const { t, lang } = useLanguage();
  const [locationId, setLocationId] = useState(CAMPAIGN.locations[0]?.id ?? '');
  const [when, setWhen] = useState(nowLocalInputValue);
  const [note, setNote] = useState('');
  const [delivered, setDelivered] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linkedTransferId, setLinkedTransferId] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const fileInput = useRef<HTMLInputElement>(null);
  const transfers = useRecentTransfers();
  const { reports: mine, loading: mineLoading } = useMyReports(user.uid);

  const canSubmit = (note.trim().length > 0 || photos.length > 0) && !uploading;

  const onPickPhotos = async (files: FileList | null) => {
    if (!files || !cloudinaryReady) return;
    const remaining = MAX_PHOTOS - photos.length;
    const batch = Array.from(files).slice(0, remaining);
    if (batch.length === 0) return;
    setUploading(true);
    try {
      for (const file of batch) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const result = await uploadToCloudinary(compressed, { folder: 'lapa-field/reports' });
        setPhotos((p) => [...p, { url: result.secureUrl }]);
      }
    } catch (err) {
      console.error('[FieldReportForm] upload failed:', err);
      toast.error(t.admin.transferForm.uploadFailed);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!db || !canSubmit || saveState !== 'idle') return;
    setSaveState('saving');
    try {
      const picked = new Date(when);
      const happenedMs = Number.isNaN(picked.getTime()) ? Date.now() : picked.getTime();
      await addDoc(collection(db, 'fieldReports'), {
        note: note.trim(),
        location: locationId,
        happenedAt: Timestamp.fromMillis(happenedMs),
        photoUrls: photos.map((p) => p.url),
        ...(delivered.trim() ? { delivered: delivered.trim() } : {}),
        ...(linkedTransferId ? { linkedTransferId } : {}),
        authorUid: user.uid,
        authorName: user.email?.split('@')[0] ?? 'volunteer',
        status: 'submitted',
        missionDay: missionDay(happenedMs),
        createdAt: serverTimestamp(),
      });
      void logAudit(db, 'fieldreport.submit', { location: locationId, photos: photos.length });
      toast.success(t.ops.field.submitted);
      setSaveState('saved');
      setTimeout(() => {
        setSaveState('idle');
        setNote('');
        setDelivered('');
        setPhotos([]);
        setLinkedTransferId('');
        setWhen(nowLocalInputValue());
      }, 2000);
    } catch (err) {
      console.error('[FieldReportForm] submit failed:', err);
      toast.error(t.common.saveFailed);
      setSaveState('idle');
    }
  };

  const statusChip = (status: FieldReport['status']) => {
    const map = {
      submitted: { icon: Clock, cls: 'border-amber/40 bg-amber-glow text-amber' },
      approved: { icon: CheckCircle2, cls: 'border-sage/40 bg-sage/10 text-sage' },
      rejected: { icon: XCircle, cls: 'border-danger/40 bg-danger/10 text-danger' },
    } as const;
    const { icon: Icon, cls } = map[status];
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em]', cls)}>
        <Icon className="h-3 w-3" /> {t.ops.field.status[status]}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <Field label={t.ops.field.location}>
          <div className="flex flex-wrap gap-2">
            {CAMPAIGN.locations.map((loc) => {
              const active = locationId === loc.id;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setLocationId(loc.id)}
                  className={cn(
                    'h-9 rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-150',
                    active
                      ? 'border-amber bg-amber text-white'
                      : 'border-border bg-surface text-text-muted hover:text-text',
                  )}
                >
                  {lang === 'es' ? loc.es : loc.en}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label={t.ops.field.when}>
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label={t.ops.field.note}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.ops.field.notePh}
            rows={3}
            maxLength={280}
            className={textareaCls}
          />
        </Field>

        <Field label={t.ops.field.delivered}>
          <input
            type="text"
            value={delivered}
            onChange={(e) => setDelivered(e.target.value)}
            placeholder={t.ops.field.deliveredPh}
            className={inputCls}
          />
        </Field>

        <Field label={t.ops.field.photos} hint={t.ops.field.photosHint}>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => void onPickPhotos(e.target.files)}
          />
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p) => (
              <div key={p.url} className="relative aspect-square overflow-hidden rounded-[10px] border border-border">
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((all) => all.filter((x) => x.url !== p.url))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex aspect-square items-center justify-center rounded-[10px] border border-dashed border-border-strong bg-surface-2 text-text-muted transition-colors hover:border-amber hover:text-amber disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
              </button>
            )}
          </div>
        </Field>

        {transfers.length > 0 && (
          <Field label={t.ops.field.linkPurchase}>
            <select
              value={linkedTransferId}
              onChange={(e) => setLinkedTransferId(e.target.value)}
              className={cn(inputCls, 'appearance-none')}
            >
              <option value="">{t.ops.field.linkPurchaseNone}</option>
              {transfers.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {formatMoney(tr.amount)} · {pickLang(tr, 'purpose', lang)} ·{' '}
                  {formatShortDate(toMillis(tr.timestamp), lang)}
                </option>
              ))}
            </select>
          </Field>
        )}

        <SubmitButton state={saveState} label={t.ops.field.submit} disabled={!canSubmit} />
      </form>

      {/* My submissions */}
      <section>
        <h2 className="font-display text-[19px] font-medium text-text">{t.ops.field.mineTitle}</h2>
        <div className="mt-4 flex flex-col gap-3">
          {mineLoading ? (
            <div className="h-16 animate-pulse rounded-card bg-surface-2" />
          ) : mine.length === 0 ? (
            <p className="text-[13px] font-medium text-text-faint">{t.ops.field.empty}</p>
          ) : (
            mine.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                {r.photoUrls[0] ? (
                  <img src={r.photoUrls[0]} alt="" className="h-12 w-12 shrink-0 rounded-[8px] object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-text">{r.note || r.delivered || '—'}</p>
                  <p className="mt-0.5 text-[12px] text-text-faint">
                    {formatShortDate(toMillis(r.happenedAt), lang)}
                    {r.rejectReason ? ` · ${r.rejectReason}` : ''}
                  </p>
                </div>
                {statusChip(r.status)}
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
