/**
 * Shared Firestore write helpers for the admin workbench.
 */
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  Timestamp,
  type DocumentReference,
  type FieldValue,
  type Firestore,
} from 'firebase/firestore';
import { auth } from '@/lib/firebase';

/** stats/global — every money/impact write touches this doc (merge-safe). */
export function statsGlobalRef(db: Firestore): DocumentReference {
  return doc(db, 'stats', 'global');
}

/**
 * The workbench datetime field defaults to "now". When the admin leaves it
 * essentially untouched (within 60s) we use serverTimestamp() so the server
 * clock wins; a deliberately backdated entry is stored as an explicit
 * Timestamp instead.
 */
export function resolveTimestamp(datetimeLocal: string): Timestamp | FieldValue {
  const picked = new Date(datetimeLocal);
  if (Number.isNaN(picked.getTime())) return serverTimestamp();
  if (Math.abs(Date.now() - picked.getTime()) < 60_000) return serverTimestamp();
  return Timestamp.fromDate(picked);
}

/** Current local time formatted for <input type="datetime-local">. */
export function nowLocalInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Append-only audit trail (auditLogs collection). Records WHO did WHAT and
 * WHEN for every privileged write. Best-effort: a failed audit write never
 * blocks the real operation, but it is logged to the console.
 */
export async function logAudit(
  db: Firestore,
  action: string,
  detail: Record<string, string | number | boolean | null> = {},
): Promise<void> {
  const user = auth?.currentUser;
  if (!user) return;
  try {
    await addDoc(collection(db, 'auditLogs'), {
      actorUid: user.uid,
      actorEmail: user.email ?? null,
      action,
      detail,
      at: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[audit] write failed:', err);
  }
}
