/**
 * Field reports — volunteer submissions waiting for review, plus a
 * volunteer's own history (spec §12–13).
 *
 * Two live views over the same collection:
 *   - queue (admin/finance): everything 'submitted', oldest first
 *   - mine  (field volunteer): everything by this author, newest first
 * No composite indexes: single where() + client-side sort.
 */
import { useEffect, useState } from 'react';
import {
  collection,
  limit as fbLimit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toMillis } from '@/lib/format';
import type { FieldReport } from '@/lib/types';

interface ReportsState {
  reports: FieldReport[];
  loading: boolean;
}

function useReports(whereField: string, whereValue: string, sortAsc: boolean): ReportsState {
  const [state, setState] = useState<ReportsState>({ reports: [], loading: true });
  useEffect(() => {
    if (!db || !whereValue) {
      setState({ reports: [], loading: false });
      return;
    }
    const q = query(
      collection(db, 'fieldReports'),
      where(whereField, '==', whereValue),
      fbLimit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const reports = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as FieldReport)
          .sort((a, b) =>
            sortAsc
              ? toMillis(a.createdAt) - toMillis(b.createdAt)
              : toMillis(b.createdAt) - toMillis(a.createdAt),
          );
        setState({ reports, loading: false });
      },
      (err) => {
        console.warn('[useFieldReports] listener failed:', err);
        setState({ reports: [], loading: false });
      },
    );
    return unsub;
  }, [whereField, whereValue, sortAsc]);
  return state;
}

/** Admin/finance review queue — pending submissions, oldest first. */
export function useReportQueue(): ReportsState {
  return useReports('status', 'submitted', true);
}

/** A volunteer's own submissions, newest first. */
export function useMyReports(uid: string | undefined): ReportsState {
  return useReports('authorUid', uid ?? '', false);
}
