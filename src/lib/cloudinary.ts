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
