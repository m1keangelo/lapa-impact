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

/** donors/{code} — code is the document ID (6 numeric digits). */
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
  /** legacy six-digit code — written only by the pre-§58 gift form */
  donorCode?: string;
  /** integer cents */
  amount: number;
  timestamp: TimestampLike;
  note?: string;
  /** Spanish translation of `note`, written by the translateContent function */
  noteEs?: string;
  email?: string;
  /** denormalized privacy-safe display name, e.g. "Maria G." */
  donorName?: string;
  /** Firebase Auth uid of the donor's account, stamped server-side (§35–37). */
  donorUid?: string;
  /** 'ticket' for event tickets, otherwise stripe checkout */
  source?: string;
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
  /* ——— Purchase detail (live ground-zero spec §10–11) ——— */
  /** Who was paid — store, supplier, transport company. */
  vendor?: string;
  /** Spending category: food, water, hygiene, shelter, transport, medical… */
  category?: string;
  /** Where the money went to work (location id from CAMPAIGN.locations). */
  location?: string;
  /** Receipt photo (Cloudinary URL) — the public "View receipt" proof. */
  receiptUrl?: string;
  /** Mission day, assigned automatically at write time. */
  missionDay?: number;
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
  /* ——— Proof chain (live ground-zero spec §7, §20) ——— */
  /** Where this happened (location id from CAMPAIGN.locations). */
  location?: string;
  /** What kind of step in the chain: delivery, field note, milestone. */
  category?: 'delivery' | 'field' | 'milestone' | 'note';
  /** Mission day, assigned automatically at publish time. */
  missionDay?: number;
  /** Volunteer/team member who reported it (display name). */
  authorName?: string;
  /** The purchase (transfers/{id}) this update delivers on — the chain link. */
  linkedTransferId?: string;
  /** The fieldReports/{id} doc this public update was approved from. */
  sourceReportId?: string;
}

/* ------------------------------------------------------------------ */
/* Staff + roles (live ground-zero spec §8–13)                          */
/* ------------------------------------------------------------------ */

/** staff/{uid} — who is allowed behind the public site, and at what level. */
export type StaffRole = 'admin' | 'finance' | 'field';

export interface StaffUser {
  /** Display name, e.g. "Mayra" — shown as attribution on approvals. */
  name: string;
  role: StaffRole;
  active: boolean;
  email?: string;
  createdAt?: TimestampLike;
}

/**
 * fieldReports/{id} — volunteer submissions from the ground.
 * Flow: submitted → approved (creates a public updates/{id} + media docs)
 * or rejected. Volunteers never touch money or publish directly.
 */
export interface FieldReport {
  id: string;
  /** Short human sentence — "Food and water reached the albergue." */
  note: string;
  noteEs?: string;
  /** Where it happened (location id from CAMPAIGN.locations). */
  location: string;
  /** When it happened on the ground (not when it was typed). */
  happenedAt: TimestampLike;
  /** Cloudinary URLs, max 4. */
  photoUrls: string[];
  /** Optional link to the purchase (transfers/{id}) this report proves. */
  linkedTransferId?: string;
  /** What was delivered, when applicable — "40 kits de higiene". */
  delivered?: string;
  authorUid: string;
  authorName: string;
  status: 'submitted' | 'approved' | 'rejected';
  /** Set at creation from happenedAt. */
  missionDay: number;
  createdAt: TimestampLike;
  reviewedBy?: string;
  reviewedAt?: TimestampLike;
  /** The public update created on approval. */
  publishedUpdateId?: string;
  rejectReason?: string;
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
