/**
 * Firestore flat schema (design.md §8, original spec).
 * All money is integer cents. Timestamps are Firestore Timestamps in
 * production and plain millisecond numbers in demo data.
 */

/** Firestore Timestamp, Date, or epoch millis (demo data). */
export type TimestampLike =
  | { toMillis(): number; seconds?: number }
  | Date
  | number;

/** donors/{code} — code is the document ID (nanoid Base58, 12 chars). */
export interface Donor {
  code: string;
  name: string;
  email?: string;
  /** lifetime total given, integer cents */
  totalGiven: number;
  createdAt: TimestampLike;
}

/** donations/{id} */
export interface Donation {
  id: string;
  donorCode: string;
  /** integer cents */
  amount: number;
  timestamp: TimestampLike;
  note?: string;
  /** Spanish translation of `note`, written by the translateContent function */
  noteEs?: string;
  email?: string;
  /** denormalized privacy-safe display name, e.g. "Maria G." */
  donorName?: string;
}

/** transfers/{id} — money out to the field. */
export interface Transfer {
  id: string;
  /** integer cents */
  amount: number;
  timestamp: TimestampLike;
  recipient: string;
  /** Spanish translation of `recipient` (translateContent function) */
  recipientEs?: string;
  purpose: string;
  /** Spanish translation of `purpose` (translateContent function) */
  purposeEs?: string;
  proofUrl?: string;
}

/** updates/{id} — field reports. */
export interface ImpactUpdate {
  id: string;
  title: string;
  /** Spanish translation of `title` (translateContent function) */
  titleEs?: string;
  body: string;
  /** Spanish translation of `body` (translateContent function) */
  bodyEs?: string;
  /** free-form ledger metrics, e.g. { "water filters": 40 } */
  metrics: Record<string, string | number>;
  /** metrics with Spanish labels (translateContent function) */
  metricsEs?: Record<string, string | number>;
  timestamp: TimestampLike;
  mediaIds?: string[];
}

/** media/{id} — photos from the field (Cloudinary). */
export interface MediaItem {
  id: string;
  cloudinaryUrl: string;
  thumbnailUrl: string;
  caption: string;
  /** Spanish translation of `caption` (translateContent function) */
  captionEs?: string;
  timestamp: TimestampLike;
  donationId?: string;
  updateId?: string;
}

/** stats/{id} — 'global' holds the hero totals. */
export interface GlobalStats {
  /** integer cents, all-time donations in */
  totalIn: number;
  /** integer cents, all-time transfers out */
  totalOut: number;
  familiesHelped: number;
  updatedAt?: TimestampLike;
}

/** Normalized entry for the combined live feed (mixed collections). */
export type FeedEntry =
  | { kind: 'donation'; id: string; ts: number; donation: Donation }
  | { kind: 'transfer'; id: string; ts: number; transfer: Transfer }
  | { kind: 'update'; id: string; ts: number; update: ImpactUpdate }
  | { kind: 'photo'; id: string; ts: number; media: MediaItem };

/** Shared async state for every live surface (design.md §8: 4 states). */
export type LiveStatus = 'loading' | 'empty' | 'error' | 'live';
