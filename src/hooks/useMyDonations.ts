/**
 * useMyDonations — bounded live query of the signed-in donor's gifts:
 * donations.where('donorUid','==', uid).limit(25), sorted newest-first
 * client-side (avoids requiring a composite index). Empty when signed out
 * or when Firebase isn't configured (no demo fallback — this surface is
 * personal and only real gifts belong here, master §52).
 */
import { useEffect, useState } from 'react';
import {
  collection,
  limit as fbLimit,
  onSnapshot,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase';
import { toMillis } from '@/lib/format';
import type { Donation, LiveStatus } from '@/lib/types';

export interface MyDonationsResult {
  donations: Donation[];
  status: LiveStatus;
}

export function useMyDonations(
  uid: string | null,
  max = 25,
  retryKey = 0,
): MyDonationsResult {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [status, setStatus] = useState<LiveStatus>(
    uid && firebaseReady ? 'loading' : 'empty',
  );

  useEffect(() => {
    if (!uid || !firebaseReady || !db) {
      setDonations([]);
      setStatus('empty');
      return;
    }
    setStatus('loading');
    const q = query(
      collection(db, 'donations'),
      where('donorUid', '==', uid),
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
        setDonations(rows);
        setStatus(rows.length === 0 ? 'empty' : 'live');
      },
      (err) => {
        console.error('[useMyDonations] snapshot error:', err);
        setStatus('error');
      },
    );
    return unsub;
  }, [uid, max, retryKey]);

  return { donations, status };
}
