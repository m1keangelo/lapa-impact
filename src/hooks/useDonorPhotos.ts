/**
 * useDonorPhotos — field photos matched to the donor: media whose
 * donationId is one of the donor's own donation ids (dashboard.md §4b).
 * Firestore `in` query (≤25 ids), bounded with .limit(), sorted
 * newest-first client-side. Demo mode filters bundled demo media.
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
import { demoMedia } from '@/lib/demoData';
import { toMillis } from '@/lib/format';
import type { LiveStatus, MediaItem } from '@/lib/types';

export interface DonorPhotosResult {
  photos: MediaItem[];
  status: LiveStatus;
  isDemo: boolean;
}

export function demoPhotosFor(donationIds: string[]): MediaItem[] {
  const ids = new Set(donationIds);
  return demoMedia
    .filter((m) => m.donationId && ids.has(m.donationId))
    .sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
}

export function useDonorPhotos(
  donationIds: string[],
  max = 8,
  retryKey = 0,
): DonorPhotosResult {
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [status, setStatus] = useState<LiveStatus>(
    firebaseReady && donationIds.length ? 'loading' : 'empty',
  );
  const idsKey = donationIds.join(',');

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',').slice(0, 25) : [];
    if (ids.length === 0) {
      // No gifts → no matched photos. The page gates its loading state on
      // the donations query, so 'empty' here is safe.
      setPhotos([]);
      setStatus('empty');
      return;
    }
    if (!firebaseReady || !db) {
      const demo = demoPhotosFor(ids);
      setPhotos(demo);
      setStatus(demo.length ? 'live' : 'empty');
      return;
    }
    setStatus('loading');
    const q = query(
      collection(db, 'media'),
      where('donationId', 'in', ids),
      fbLimit(max),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        })) as MediaItem[];
        rows.sort((a, b) => toMillis(b.timestamp) - toMillis(a.timestamp));
        setPhotos(rows);
        setStatus(rows.length === 0 ? 'empty' : 'live');
      },
      (err) => {
        console.error('[useDonorPhotos] snapshot error:', err);
        setStatus('error');
      },
    );
    return unsub;
  }, [idsKey, max, retryKey]);

  return { photos, status, isDemo: !firebaseReady };
}
