/**
 * Photo upload queue for the admin Photos tab: accepts files, compresses
 * each in the browser (browser-image-compression, ≤1MB / ≤1920px) BEFORE
 * uploading to Cloudinary via the unsigned preset helper. Per-photo state
 * machine: queued → compressing → uploading → done | error (retryable).
 */
import { useCallback, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { nanoid } from 'nanoid';
import {
  cloudinaryReady,
  uploadToCloudinary,
  type CloudinaryUploadResult,
} from '@/lib/cloudinary';

export type PhotoStatus = 'compressing' | 'uploading' | 'done' | 'error';

export interface QueuedPhoto {
  id: string;
  file: File;
  /** local object URL for the in-queue thumbnail */
  previewUrl: string;
  name: string;
  /** original size in bytes */
  size: number;
  status: PhotoStatus;
  /** 0–100 coarse progress (fetch has no byte-level progress) */
  progress: number;
  result: CloudinaryUploadResult | null;
  error: string | null;
  caption: string;
  /** donor code the photo should be linked to (optional) */
  linkCode: string;
  /** the code the donation link was resolved against (stale-guard) */
  linkResolvedCode?: string;
  /** resolved donations doc id once linked */
  donationId?: string;
}

const COMPRESS_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

export function usePhotoQueue() {
  const [items, setItems] = useState<QueuedPhoto[]>([]);
  const itemsRef = useRef<QueuedPhoto[]>([]);
  itemsRef.current = items;

  const patch = useCallback((id: string, p: Partial<QueuedPhoto>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...p } : it)));
  }, []);

  const processOne = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((it) => it.id === id);
      if (!item) return;
      try {
        if (!cloudinaryReady) {
          throw new Error(
            'Cloudinary is not configured — set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.',
          );
        }
        patch(id, { status: 'compressing', progress: 25, error: null });
        const compressed = await imageCompression(item.file, COMPRESS_OPTIONS);
        patch(id, { status: 'uploading', progress: 60 });
        const result = await uploadToCloudinary(compressed, { folder: 'lapa-field' });
        patch(id, { status: 'done', progress: 100, result });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed.';
        patch(id, { status: 'error', progress: 0, error: message });
      }
    },
    [patch],
  );

  const addFiles = useCallback(
    (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith('image/'));
      if (images.length === 0) return;
      const queued: QueuedPhoto[] = images.map((file) => ({
        id: nanoid(10),
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        status: 'compressing',
        progress: 10,
        result: null,
        error: null,
        caption: '',
        linkCode: '',
      }));
      setItems((prev) => [...prev, ...queued]);
      // Kick off processing after state lands.
      setTimeout(() => queued.forEach((q) => void processOne(q.id)), 0);
    },
    [processOne],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  }, []);

  const retry = useCallback(
    (id: string) => {
      void processOne(id);
    },
    [processOne],
  );

  /** Remove published items (and revoke their object URLs). */
  const clearDone = useCallback((ids: string[]) => {
    setItems((prev) => {
      prev.forEach((it) => {
        if (ids.includes(it.id)) URL.revokeObjectURL(it.previewUrl);
      });
      return prev.filter((it) => !ids.includes(it.id));
    });
  }, []);

  return { items, addFiles, remove, retry, patch, clearDone };
}

/** Human-readable file size ("842 KB", "2.1 MB"). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
