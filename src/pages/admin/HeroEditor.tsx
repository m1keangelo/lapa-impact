/**
 * Workbench Tab — Hero photos ("Portada").
 * Manages the rotating background photos behind the homepage headline:
 * pick files → compress in-browser (≤1MB / ≤1920px) → unsigned Cloudinary
 * upload (folder lapa-hero) → append to settings/hero { images: [] }.
 * The homepage hero crossfades through the list (4s each, 1.2s fade) in
 * the order shown here; removing the last image restores the default photo.
 * Only admins can write settings/{id} (firestore.rules).
 */
import { useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { CircleAlert, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/i18n/LanguageContext';
import { useHeroImages } from '@/hooks/useHeroImages';
import { cloudinaryReady, cloudinaryThumb, uploadToCloudinary } from '@/lib/cloudinary';
import { db } from '@/lib/firebase';
import type { StaffUser } from '@/lib/types';

export default function HeroEditor({ staff, email }: { staff: StaffUser; email: string }) {
  const { t } = useLanguage();
  const hf = t.admin.heroForm;
  const { images, loading } = useHeroImages();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canEdit = staff.role === 'admin';

  const save = async (next: string[]) => {
    if (!db) throw new Error('Firebase not configured');
    await setDoc(doc(db, 'settings', 'hero'), {
      images: next,
      updatedAt: serverTimestamp(),
      updatedBy: email,
    });
  };

  const onFiles = async (files: File[]) => {
    if (files.length === 0 || busy || !canEdit) return;
    setBusy(true);
    try {
      let next = [...images];
      for (const file of files) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const result = await uploadToCloudinary(compressed, { folder: 'lapa-hero' });
        next = [...next, result.secureUrl];
      }
      await save(next);
      toast.success(hf.saved);
    } catch (err) {
      console.warn('[HeroEditor] upload failed:', err);
      toast.error(t.common.saveFailed);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const removeAt = async (idx: number) => {
    if (busy || !canEdit) return;
    setBusy(true);
    try {
      await save(images.filter((_, i) => i !== idx));
      toast.success(hf.saved);
    } catch (err) {
      console.warn('[HeroEditor] remove failed:', err);
      toast.error(t.common.saveFailed);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-border-strong border-t-amber" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[15px] font-semibold text-text">{hf.title}</h3>
        <p className="mt-1 max-w-[64ch] text-[13px] leading-[1.6] text-text-muted">{hf.sub}</p>
      </div>

      {!cloudinaryReady && (
        <p className="flex items-center gap-2 rounded-[10px] border border-danger/60 px-3.5 py-2.5 text-[13px] font-medium text-danger">
          <CircleAlert className="h-4 w-4 shrink-0" />
          {t.admin.photosForm.cloudinaryNotice}
        </p>
      )}

      {!canEdit && (
        <p className="flex items-center gap-2 rounded-[10px] border border-border bg-surface-2/60 px-3.5 py-2.5 text-[13px] font-medium text-text-muted">
          <CircleAlert className="h-4 w-4 shrink-0" />
          {hf.readOnly}
        </p>
      )}

      {/* Upload */}
      <button
        type="button"
        disabled={!canEdit || !cloudinaryReady || busy}
        onClick={() => inputRef.current?.click()}
        className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-card border-2 border-dashed border-border-strong px-6 py-8 text-center transition-colors duration-200 ease-calm hover:border-amber/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-7 w-7 animate-spin text-amber" strokeWidth={1.5} />
        ) : (
          <ImagePlus className="h-7 w-7 text-text-faint" strokeWidth={1.5} />
        )}
        <span className="text-[14px] font-medium text-text-muted">
          {busy ? hf.uploading : hf.uploadCta}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void onFiles(Array.from(e.target.files ?? []))}
      />

      {/* Current rotation */}
      {images.length === 0 ? (
        <p className="rounded-[10px] border border-border bg-surface-2/60 px-3.5 py-3 text-[13px] text-text-muted">
          {hf.empty}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((src, i) => (
            <li
              key={src}
              className="group relative overflow-hidden rounded-[12px] border border-border bg-surface-2"
            >
              <img
                src={cloudinaryThumb(src, 400)}
                alt=""
                className="aspect-[16/10] w-full object-cover"
              />
              <span className="absolute left-2 top-2 rounded-[6px] bg-black/60 px-2 py-0.5 font-mono text-[11px] font-medium text-white">
                {i + 1}
              </span>
              <button
                type="button"
                disabled={!canEdit || busy}
                onClick={() => void removeAt(i)}
                aria-label={hf.removeAria}
                className="absolute right-2 top-2 rounded-[8px] bg-black/60 p-2 text-white transition-colors hover:bg-danger disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
