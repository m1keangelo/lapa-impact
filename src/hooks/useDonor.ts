/**
 * useDonor — live subscription to donors/{code}. Falls back to a donor
 * synthesized from bundled demo data (any donorCode present in
 * demoDonations) when Firebase is not configured, so the demo flow works
 * end-to-end with a code like `X7kQ2mPv9Rt4`.
 */
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase';
import { demoDonations } from '@/lib/demoData';
import { toMillis } from '@/lib/format';
import type { Donor, LiveStatus } from '@/lib/types';

export interface DonorResult {
  donor: Donor | null;
  status: LiveStatus;
  isDemo: boolean;
}

/** Synthesize a Donor from demo donations for the given code (demo mode). */
export function demoDonorFor(code: string): Donor | null {
  const gifts = demoDonations.filter((d) => d.donorCode === code);
  if (gifts.length === 0) return null;
  const totalGiven = gifts.reduce((sum, d) => sum + d.amount, 0);
  const createdAt = Math.min(...gifts.map((d) => toMillis(d.timestamp)));
  return {
    code,
    // demo donations carry the privacy-safe display name ("Maria G.")
    name: gifts[0].donorName ?? 'Friend of the mission',
    totalGiven,
    createdAt,
  };
}

/** First name for the personal greeting. */
export function donorFirstName(donor: Donor | null): string {
  if (!donor?.name) return 'friend';
  return donor.name.trim().split(/\s+/)[0] ?? 'friend';
}

export function useDonor(code: string | null, retryKey = 0): DonorResult {
  const [donor, setDonor] = useState<Donor | null>(null);
  const [status, setStatus] = useState<LiveStatus>(
    code ? 'loading' : 'empty',
  );

  useEffect(() => {
    if (!code) {
      setDonor(null);
      setStatus('empty');
      return;
    }
    if (!firebaseReady || !db) {
      const demo = demoDonorFor(code);
      setDonor(demo);
      setStatus(demo ? 'live' : 'empty');
      return;
    }
    setStatus('loading');
    const unsub = onSnapshot(
      doc(db, 'donors', code),
      (snap) => {
        if (!snap.exists()) {
          setDonor(null);
          setStatus('empty');
          return;
        }
        const data = snap.data() as Partial<Donor>;
        setDonor({
          code,
          name: data.name ?? 'Friend of the mission',
          email: data.email,
          totalGiven: data.totalGiven ?? 0,
          createdAt: data.createdAt ?? Date.now(),
        });
        setStatus('live');
      },
      (err) => {
        console.error('[useDonor] snapshot error:', err);
        setStatus('error');
      },
    );
    return unsub;
  }, [code, retryKey]);

  return { donor, status, isDemo: !firebaseReady };
}
