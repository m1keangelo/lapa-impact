/**
 * Cloudinary helpers. Fetch URLs always go through f_auto,q_auto with an
 * optional width (design.md §2). The unsigned upload helper is fully
 * functional; wiring it into the admin form is the admin agent's job.
 *
 * Env vars:
 *   VITE_CLOUDINARY_CLOUD_NAME     — Cloudinary cloud name
 *   VITE_CLOUDINARY_UPLOAD_PRESET  — unsigned upload preset (admin uploads)
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export const cloudinaryReady: boolean = Boolean(CLOUD_NAME);

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale';
  quality?: string;
}

/**
 * Build a Cloudinary fetch URL with f_auto,q_auto applied.
 * Accepts either a public ID ("lapa/abc123") or a full Cloudinary URL
 * (transforms are injected after /upload/). Non-Cloudinary URLs (e.g. demo
 * assets in /public) are returned unchanged.
 */
export function cloudinaryUrl(
  source: string,
  { width, height, crop = 'limit', quality = 'auto' }: CloudinaryTransformOptions = {},
): string {
  if (!source || !CLOUD_NAME) return source;
  if (!source.includes('res.cloudinary.com') && source.startsWith('/')) return source;

  const parts = [`f_auto,q_${quality}`, crop ? `c_${crop}` : '']
    .filter(Boolean);
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  const transform = parts.join(',');

  if (source.includes('res.cloudinary.com')) {
    // Inject transforms into an existing delivery URL.
    if (source.includes('/upload/f_auto')) return source;
    return source.replace('/upload/', `/upload/${transform}/`);
  }
  // Bare public ID
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${source}`;
}

/** Convenience: responsive thumbnail. */
export function cloudinaryThumb(source: string, width = 480): string {
  return cloudinaryUrl(source, { width, crop: 'fill' });
}

/* ------------------------------------------------------------------ */
/* Upload validation (security pass). Uploads are an attack surface:   */
/* never trust the filename or the declared MIME type — check the      */
/* actual magic bytes. JPEG / PNG / WebP only, max 10 MB source.        */
/* ------------------------------------------------------------------ */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Throws 'too-big' or 'bad-type' unless the file is a real JPEG/PNG/WebP
 * under 10 MB. Call BEFORE compressing/uploading.
 */
export async function assertValidImage(file: File | Blob): Promise<void> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('too-big');
  const type = (file as File).type ?? '';
  if (!IMAGE_MIME.has(type)) throw new Error('bad-type');
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng =
    head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isWebp =
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (!isJpeg && !isPng && !isWebp) throw new Error('bad-type');
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Unsigned upload to Cloudinary. Compress the file with
 * browser-image-compression BEFORE calling this (admin flow).
 * Throws when cloud name / preset are not configured.
 */
export async function uploadToCloudinary(
  file: File | Blob,
  options: { folder?: string; publicId?: string } = {},
): Promise<CloudinaryUploadResult> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary is not configured (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET missing).',
    );
  }
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  if (options.folder) form.append('folder', options.folder);
  if (options.publicId) form.append('public_id', options.publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }
  const json = (await res.json()) as {
    public_id: string;
    secure_url: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  };
  return {
    publicId: json.public_id,
    secureUrl: json.secure_url,
    width: json.width,
    height: json.height,
    format: json.format,
    bytes: json.bytes,
  };
}
