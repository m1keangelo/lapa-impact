/**
 * Workbench Tab D — Upload photos.
 * Plain drop handlers + hidden inputs (no react-dropzone). Files are
 * compressed in the browser (≤1MB / ≤1920px) BEFORE the unsigned Cloudinary
 * upload. Per-photo queue with progress states, caption input and optional
 * link to a gift (donor-code → latest matching donations doc).
 * Publish writes media/{id} docs (cloudinaryUrl + w=400 thumbnailUrl) in
 * one batch.
 */
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  collection,
  doc,
  getDocs,
  limit as fbLimit,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Camera,
  CheckCircle2,
  CircleAlert,
  ImagePlus,
  Link2,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { cloudinaryReady, cloudinaryThumb, cloudinaryUrl } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import { formatMoney, toMillis } from '@/lib/format';
import { DONOR_CODE_LENGTH, isPlausibleDonorCode } from '@/lib/session';
import { cn } from '@/lib/utils';
import type { Donation } from '@/lib/types';
import { SubmitButton } from './fields';
import { inputCls } from './formUtils';
import { formatBytes, usePhotoQueue, type QueuedPhoto } from './usePhotoQueue';

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ------------------------------------------------------------------ */
/* Optional gift linking: donor code → most recent donation doc id      */
/* ------------------------------------------------------------------ */

function PhotoLinkField({
  item,
  onCodeChange,
  onResolved,
}: {
  item: QueuedPhoto;
  onCodeChange: (v: string) => void;
  onResolved: (code: string, donationId: string) => void;
}) {
  const code = item.linkCode.trim();
  const eligible = isPlausibleDonorCode(code);
  const [result, setResult] = useState<{
    code: string;
    status: 'linked' | 'none';
    label: string;
  } | null>(null);
  const onResolvedRef = useRef(onResolved);
  useEffect(() => {
    onResolvedRef.current = onResolved;
  });

  useEffect(() => {
    if (!eligible) return;
    const timer = setTimeout(async () => {
      if (!db) {
        setResult({ code, status: 'none', label: '' });
        return;
      }
      try {
        // where + limit only (no orderBy) — avoids a composite index;
        // pick the most recent match client-side.
        const q = query(
          collection(db, 'donations'),
          where('donorCode', '==', code),
          fbLimit(5),
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setResult({ code, status: 'none', label: '' });
          return;
        }
        const donations = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Donation, 'id'>) }))
          .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
        const latest = donations[0];
        if (!latest) {
          setResult({ code, status: 'none', label: '' });
          return;
        }
        onResolvedRef.current(code, latest.id);
        setResult({
          code,
          status: 'linked',
          label: `${latest.donorName ?? 'donor'} · ${formatMoney(latest.amount)} gift`,
        });
      } catch (err) {
        console.error('[PhotoLinkField] lookup failed:', err);
        setResult({ code, status: 'none', label: '' });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [code, eligible]);

  // Display state is derived during render (no sync setState in effects).
  let status: 'idle' | 'checking' | 'linked' | 'none' = 'idle';
  let label = '';
  if (code.length >= DONOR_CODE_LENGTH) {
    if (!eligible) {
      status = 'none';
    } else if (result && result.code === code) {
      status = result.status;
      label = result.label;
    } else {
      status = 'checking';
    }
  }

  return (
    <div className="mt-2">
      <div className="relative">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-faint" />
        <input
          type="text"
          maxLength={DONOR_CODE_LENGTH}
          placeholder="Link to a gift — donor code (optional)"
          value={item.linkCode}
          onChange={(e) => onCodeChange(e.target.value.trim())}
          spellCheck={false}
          className={cn(inputCls, 'h-10 pl-9 font-mono text-[13px] tracking-[0.06em]')}
        />
      </div>
      {status === 'checking' && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-text-muted">
          <Loader2 className="h-3 w-3 animate-spin" /> Finding the gift…
        </p>
      )}
      {status === 'linked' && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-sage">
          <CheckCircle2 className="h-3 w-3" /> Linked to {label}
        </p>
      )}
      {status === 'none' && (
        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-danger">
          <CircleAlert className="h-3 w-3" /> No gift found for this code.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Queue tile                                                           */
/* ------------------------------------------------------------------ */

function PhotoTile({
  item,
  onRemove,
  onRetry,
  onPatch,
}: {
  item: QueuedPhoto;
  onRemove: () => void;
  onRetry: () => void;
  onPatch: (p: Partial<QueuedPhoto>) => void;
}) {
  const thumb = item.result ? cloudinaryThumb(item.result.secureUrl, 200) : item.previewUrl;
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="overflow-hidden rounded-[12px] border border-border bg-surface-2 p-3"
    >
      <div className="flex items-center gap-3">
        <img
          src={thumb}
          alt=""
          className="h-12 w-12 shrink-0 rounded-[10px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[12px] text-text">{item.name}</p>
          <p className="text-[11px] text-text-faint">{formatBytes(item.size)}</p>
          {/* 3px amber progress bar */}
          <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-surface-3">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-calm',
                item.status === 'error' ? 'bg-danger' : item.status === 'done' ? 'bg-sage' : 'bg-amber',
              )}
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
        {item.status === 'done' && <CheckCircle2 className="h-5 w-5 shrink-0 text-sage" />}
        {(item.status === 'compressing' || item.status === 'uploading') && (
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {item.status === 'compressing' ? 'Compressing' : 'Uploading'}
          </span>
        )}
        {item.status === 'error' && (
          <button
            type="button"
            onClick={onRetry}
            className="flex shrink-0 items-center gap-1.5 rounded-[8px] border border-danger/60 px-2.5 py-1.5 text-[12px] font-medium text-danger transition-colors hover:bg-danger/10"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="shrink-0 rounded-[8px] p-1.5 text-text-faint transition-colors hover:text-danger"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {item.status === 'error' && item.error && (
        <p className="mt-2 truncate text-[12px] text-danger">{item.error}</p>
      )}
      {/* Caption + gift linking once uploaded */}
      {item.status === 'done' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.25, ease: EASE }}
          className="overflow-hidden"
        >
          <input
            type="text"
            placeholder="Add a caption…"
            value={item.caption}
            onChange={(e) => onPatch({ caption: e.target.value })}
            className={cn(inputCls, 'mt-2 h-10 text-[13px]')}
          />
          <PhotoLinkField
            item={item}
            onCodeChange={(v) => onPatch({ linkCode: v })}
            onResolved={(code, donationId) =>
              onPatch({ linkResolvedCode: code, donationId })
            }
          />
        </motion.div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab                                                                  */
/* ------------------------------------------------------------------ */

export default function PhotosForm({ onSaved }: { onSaved: () => void }) {
  const { items, addFiles, remove, retry, patch, clearDone } = usePhotoQueue();
  const [dragOver, setDragOver] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const browseInput = useRef<HTMLInputElement>(null);
  const captureInput = useRef<HTMLInputElement>(null);

  const doneItems = items.filter((it) => it.status === 'done');

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const publish = async () => {
    if (!db || doneItems.length === 0 || publishing) return;
    setPublishing(true);
    try {
      const batch = writeBatch(db);
      for (const it of doneItems) {
        if (!it.result) continue;
        // Only trust the link if the code hasn't changed since resolving.
        const donationId =
          it.donationId && it.linkResolvedCode === it.linkCode.trim()
            ? it.donationId
            : undefined;
        batch.set(doc(collection(db, 'media')), {
          cloudinaryUrl: cloudinaryUrl(it.result.secureUrl),
          thumbnailUrl: cloudinaryUrl(it.result.secureUrl, { width: 400 }),
          caption: it.caption.trim(),
          timestamp: serverTimestamp(),
          ...(donationId ? { donationId } : {}),
        });
      }
      await batch.commit();
      toast.success(
        `${doneItems.length} photo${doneItems.length === 1 ? '' : 's'} published — live now.`,
      );
      onSaved();
      clearDone(doneItems.map((it) => it.id));
    } catch (err) {
      console.error('[PhotosForm] publish failed:', err);
      toast.error("Couldn't save — check connection, nothing was recorded.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {!cloudinaryReady && (
        <p className="flex items-center gap-2 rounded-[10px] border border-danger/60 px-3.5 py-2.5 text-[13px] font-medium text-danger">
          <CircleAlert className="h-4 w-4 shrink-0" />
          Cloudinary is not configured — set VITE_CLOUDINARY_CLOUD_NAME and
          VITE_CLOUDINARY_UPLOAD_PRESET to enable uploads.
        </p>
      )}

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Add photos"
        onClick={() => browseInput.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') browseInput.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 ease-calm',
          dragOver
            ? 'border-amber bg-amber-glow'
            : 'border-border-strong hover:border-amber/70',
        )}
      >
        <motion.span animate={dragOver ? { y: [0, -6, 0] } : { y: 0 }} transition={{ duration: 0.4 }}>
          <ImagePlus
            className={cn('h-8 w-8', dragOver ? 'text-amber' : 'text-text-faint')}
            strokeWidth={1.5}
          />
        </motion.span>
        <p className="text-[14px] font-medium text-text-muted">
          Drop field photos here or tap to browse
        </p>
        <p className="max-w-[46ch] text-[12px] text-text-faint">
          Compressed in your browser before upload — originals stay on your device.
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            captureInput.current?.click();
          }}
          className="mt-1 flex items-center gap-2 rounded-[10px] border border-border px-3.5 py-2 text-[13px] font-medium text-text-muted transition-colors hover:border-amber hover:text-amber"
        >
          <Camera className="h-4 w-4" /> Take photo
        </button>
      </div>

      <input
        ref={browseInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      <input
        ref={captureInput}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          addFiles(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />

      {/* Queue */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <PhotoTile
              key={it.id}
              item={it}
              onRemove={() => remove(it.id)}
              onRetry={() => retry(it.id)}
              onPatch={(p) => patch(it.id, p)}
            />
          ))}
        </AnimatePresence>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void publish();
        }}
      >
        <SubmitButton
          state={publishing ? 'saving' : 'idle'}
          label={`Publish ${doneItems.length} photo${doneItems.length === 1 ? '' : 's'}`}
          color="amber"
          disabled={doneItems.length === 0}
        />
      </form>
    </div>
  );
}
