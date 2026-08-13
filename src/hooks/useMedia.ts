/**
 * Gallery media — bounded live listener on the media collection with
 * "load more" paging (24 at a time) and a demo fallback when Firebase
 * is not configured. Also resolves the donations / updates that photos
 * can be matched to, for gift-attribution chips in tiles and lightbox.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase';
import { demoDonations, demoMedia, demoUpdates } from '@/lib/demoData';
import type { Donation, ImpactUpdate, LiveStatus, MediaItem } from '@/lib/types';

export const MEDIA_PAGE_SIZE = 24;

function useBoundedDocs<T extends { id: string }>(
  name: string,
  limit: number,
  retryNonce: number,
): { items: T[]; status: LiveStatus; full: boolean } {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<LiveStatus>('loading');
  const [full, setFull] = useState(false);

  useEffect(() => {
    if (!firebaseReady || !db) return;
    const q = query(
      collection(db, name),
      orderBy('timestamp', 'desc'),
      fbLimit(limit),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as DocumentData),
        })) as T[];
        setItems(rows);
        setFull(rows.length >= limit);
        setStatus(rows.length === 0 ? 'empty' : 'live');
      },
      (err) => {
        console.error(`[useMedia:${name}] snapshot error:`, err);
        setStatus('error');
      },
    );
    return unsub;
  }, [name, limit, retryNonce]);

  return { items, status, full };
}

export interface MediaResult {
  items: MediaItem[];
  status: LiveStatus;
  isDemo: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  retry: () => void;
  /** lookup maps for gift / update attribution */
  donationById: ReadonlyMap<string, Donation>;
  updateById: ReadonlyMap<string, ImpactUpdate>;
}

export function useMedia(): MediaResult {
  const [limit, setLimit] = useState(MEDIA_PAGE_SIZE);
  const [retryNonce, setRetryNonce] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const media = useBoundedDocs<MediaItem>('media', limit, retryNonce);
  // Generous bounded lookups so attribution chips resolve.
  const donations = useBoundedDocs<Donation>('donations', 100, retryNonce);
  const updates = useBoundedDocs<ImpactUpdate>('updates', 100, retryNonce);

  useEffect(() => {
    if (!loadingMore) return;
    const t = setTimeout(() => setLoadingMore(false), 600);
    return () => clearTimeout(t);
  }, [media.items, loadingMore]);

  const isDemo = !firebaseReady;

  const items = useMemo(
    () =>
      isDemo
        ? [...demoMedia]
            .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
            .slice(0, limit)
        : media.items,
    [isDemo, media.items, limit],
  );

  const status: LiveStatus = isDemo
    ? items.length > 0
      ? 'live'
      : 'empty'
    : media.status;

  const hasMore = isDemo ? limit < demoMedia.length : media.full;

  const donationById = useMemo(() => {
    const src = isDemo ? demoDonations : donations.items;
    return new Map(src.map((d) => [d.id, d]));
  }, [isDemo, donations.items]);

  const updateById = useMemo(() => {
    const src = isDemo ? demoUpdates : updates.items;
    return new Map(src.map((u) => [u.id, u]));
  }, [isDemo, updates.items]);

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    setLimit((l) => l + MEDIA_PAGE_SIZE);
  }, []);

  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

  return {
    items,
    status,
    isDemo,
    hasMore,
    loadingMore,
    loadMore,
    retry,
    donationById,
    updateById,
  };
}
