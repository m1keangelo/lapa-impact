/**
 * Public combined ledger feed — merges donations + transfers + updates +
 * media into one time-ordered stream for /feed. Bounded onSnapshot
 * listeners per collection (`.limit()`); "load more" grows the bound in
 * 25-entry pages so live inserts keep flowing while paging back.
 *
 * - `freshIds`: ids that arrived via a live push after the initial
 *   snapshot — the page uses them for the signature amber flash.
 * - `retry()` re-attaches all listeners after an error.
 * - Demo fallback (firebaseReady === false) serves the bundled demo data.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentData } from 'firebase/firestore';
import { firebaseReady, getDb } from '@/lib/firebaseCore';
import { usePublicMode } from '@/hooks/usePublicMode';
import { toMillis } from '@/lib/format';
import {
  demoDonations,
  demoMedia,
  demoTransfers,
  demoUpdates,
} from '@/lib/demoData';
import type {
  Donation,
  FeedEntry,
  ImpactUpdate,
  LiveStatus,
  MediaItem,
  Transfer,
} from '@/lib/types';

export const FEED_PAGE_SIZE = 25;

interface CollectionState<T> {
  items: T[];
  status: LiveStatus;
  /** true when the last snapshot filled the whole limit (more may exist) */
  full: boolean;
}

function useBoundedCollection<T extends { id: string }>(
  name: string,
  limit: number,
  retryNonce: number,
  onFresh: (ids: string[]) => void,
): CollectionState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<LiveStatus>('loading');
  const [full, setFull] = useState(false);
  const seenRef = useRef<Set<string> | null>(null);
  const onFreshRef = useRef(onFresh);
  useEffect(() => {
    onFreshRef.current = onFresh;
  }, [onFresh]);

  useEffect(() => {
    if (!firebaseReady) return;
    let cancelled = false;
    let unsub: (() => void) | undefined;
    void (async () => {
      const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')]);
      if (cancelled || !db) return;
      const q = fs.query(
        fs.collection(db, name),
        fs.orderBy('timestamp', 'desc'),
        fs.limit(limit),
      );
      unsub = fs.onSnapshot(
        q,
        (snap) => {
          const rows = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as DocumentData),
          })) as T[];
          const seen = seenRef.current;
          if (seen === null) {
            seenRef.current = new Set(rows.map((r) => r.id));
          } else {
            const fresh = rows.filter((r) => !seen.has(r.id)).map((r) => r.id);
            for (const r of rows) seen.add(r.id);
            if (fresh.length > 0) onFreshRef.current(fresh);
          }
          setItems(rows);
          setFull(rows.length >= limit);
          setStatus(rows.length === 0 ? 'empty' : 'live');
        },
        (err) => {
          console.error(`[usePublicFeed:${name}] snapshot error:`, err);
          setStatus('error');
        },
      );
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [name, limit, retryNonce]);

  return { items, status, full };
}

export interface PublicFeedResult {
  entries: FeedEntry[];
  status: LiveStatus;
  isDemo: boolean;
  /** total loaded entries across all kinds (before kind/search filtering) */
  totalLoaded: number;
  hasMore: boolean;
  loadingMore: boolean;
  loadMore: () => void;
  retry: () => void;
  /** ids pushed in live after the initial snapshot — flash these amber */
  freshIds: ReadonlySet<string>;
  /** raw loaded docs, for the sidebar (top supporters, week stats) */
  donations: Donation[];
  transfers: Transfer[];
  updates: ImpactUpdate[];
  media: MediaItem[];
}

export function usePublicFeed(): PublicFeedResult {
  const [limit, setLimit] = useState(FEED_PAGE_SIZE);
  const [retryNonce, setRetryNonce] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());

  const onFresh = useCallback((ids: string[]) => {
    setFreshIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const donations = useBoundedCollection<Donation>('donations', limit, retryNonce, onFresh);
  const transfers = useBoundedCollection<Transfer>('transfers', limit, retryNonce, onFresh);
  const updates = useBoundedCollection<ImpactUpdate>('updates', limit, retryNonce, onFresh);
  const media = useBoundedCollection<MediaItem>('media', limit, retryNonce, onFresh);

  // Clear the "loading more" spinner once any collection refills.
  useEffect(() => {
    if (!loadingMore) return;
    const t = setTimeout(() => setLoadingMore(false), 600);
    return () => clearTimeout(t);
  }, [donations.items, transfers.items, updates.items, media.items, loadingMore]);

  const { mode } = usePublicMode();

  const status: LiveStatus = useMemo(() => {
    if (!firebaseReady || mode === 'preview') return 'live';
    const states = [donations.status, transfers.status, updates.status, media.status];
    if (states.includes('error')) return 'error';
    if (states.every((s) => s === 'empty')) return 'empty';
    if (states.includes('loading')) return 'loading';
    return 'live';
  }, [mode, donations.status, transfers.status, updates.status, media.status]);

  // Preview mode serves the bundled demo content — clearly labeled as a
  // preview — even when Firebase is live. 'live'/'paused' show real data
  // only; demo and real are never mixed (final doc §11).
  const isDemo = !firebaseReady || mode === 'preview';
  const donationsItems = isDemo ? demoDonations : donations.items;
  const transfersItems = isDemo ? demoTransfers : transfers.items;
  const updatesItems = isDemo ? demoUpdates : updates.items;
  const mediaItems = isDemo ? demoMedia : media.items;

  const entries = useMemo<FeedEntry[]>(() => {
    const all: FeedEntry[] = [
      ...donationsItems.map(
        (donation): FeedEntry => ({
          kind: 'donation',
          id: donation.id,
          ts: toMillis(donation.timestamp),
          donation,
        }),
      ),
      ...transfersItems.map(
        (transfer): FeedEntry => ({
          kind: 'transfer',
          id: transfer.id,
          ts: toMillis(transfer.timestamp),
          transfer,
        }),
      ),
      ...updatesItems.map(
        (update): FeedEntry => ({
          kind: 'update',
          id: update.id,
          ts: toMillis(update.timestamp),
          update,
        }),
      ),
      ...mediaItems.map(
        (m): FeedEntry => ({
          kind: 'photo',
          id: m.id,
          ts: toMillis(m.timestamp),
          media: m,
        }),
      ),
    ];
    all.sort((a, b) => b.ts - a.ts);
    // In demo mode, page the merged set just like Firestore pages.
    return isDemo ? all.slice(0, limit) : all;
  }, [donationsItems, transfersItems, updatesItems, mediaItems, limit, isDemo]);

  const totalDemo =
    demoDonations.length + demoTransfers.length + demoUpdates.length + demoMedia.length;
  const hasMore = isDemo
    ? limit < totalDemo
    : donations.full || transfers.full || updates.full || media.full;

  const loadMore = useCallback(() => {
    setLoadingMore(true);
    setLimit((l) => l + FEED_PAGE_SIZE);
  }, []);

  const retry = useCallback(() => {
    setRetryNonce((n) => n + 1);
  }, []);

  return {
    entries,
    status,
    isDemo,
    totalLoaded: entries.length,
    hasMore,
    loadingMore,
    loadMore,
    retry,
    freshIds,
    donations: donationsItems,
    transfers: transfersItems,
    updates: updatesItems,
    media: mediaItems,
  };
}
