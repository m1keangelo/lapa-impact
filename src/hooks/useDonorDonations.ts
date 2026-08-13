/**
 * useDonorDonations — bounded live query of this donor's gifts:
 * donations.where('donorCode','==', code).limit(25), sorted newest-first
 * client-side (avoids requiring a composite index). Falls back to filtered
 * demo data when Firebase is not configured.
 *
 * `revision` bumps when a live snapshot introduces a gift id we haven't
 * seen before — pages use it for insert animations + the ledger toast.
 */
import { useEffect, useRef, useState } from 'react';
import {
  collection,
  limit as fbLimit,
  onSnapshot,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase';
import { demoDonations } from '@/lib/demoData';
import { toMillis } from '@/lib/format';
import type { Donation, LiveStatus } from '@/lib/types';

export interface DonorDonationsResult {
  donations: Donation[];
  status: LiveStatus;
  isDemo: boolean;
  /** bumped when a genuinely new gift arrives after the first snapshot */
  revision: number;
}

export function demoDonationsFor(code: string): Donation[] {
  return demoDonations
    .filter((d) => d.donorCode === code)
    .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
}

export function useDonorDonations(
  code: string | null,
  max = 25,
  retryKey = 0,
): DonorDonationsResult {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [status, setStatus] = useState<LiveStatus>(
    code && firebaseReady ? 'loading' : 'empty',
  );
  const [revision, setRevision] = useState(0);
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    seenIds.current = null;
    if (!code) {
      setDonations([]);
      setStatus('empty');
      return;
    }
    if (!firebaseReady || !db) {
      const demo = demoDonationsFor(code);
      setDonations(demo);
      setStatus(demo.length ? 'live' : 'empty');
      return;
    }
    setStatus('loading');
    const q = query(
      collection(db, 'donations'),
      where('donorCode', '==', code),
      fbLimit(max),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        })) as Donation[];
        rows.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));

        const ids = new Set(rows.map((r) => r.id));
        if (seenIds.current !== null) {
          const isNew = rows.some((r) => !seenIds.current!.has(r.id));
          if (isNew) setRevision((r) => r + 1);
        }
        seenIds.current = ids;

        setDonations(rows);
        setStatus(rows.length === 0 ? 'empty' : 'live');
      },
      (err) => {
        console.error('[useDonorDonations] snapshot error:', err);
        setStatus('error');
      },
    );
    return unsub;
  }, [code, max, retryKey]);

  return { donations, status, isDemo: !firebaseReady, revision };
}
