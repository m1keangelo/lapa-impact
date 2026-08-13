/**
 * Bounded live collection listener — every public query is capped with
 * `.limit()` (design.md §2). Returns items + the 4-state status.
 *
 * `useFeed<T>(collectionName, { limit, orderField })` — generic single
 * collection. `useCombinedFeed(limit)` merges donations + transfers +
 * updates + media into one time-ordered feed for the home preview and the
 * feed page. Both fall back to demo data when Firebase is not configured.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
} from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase';
import { toMillis } from '@/lib/format';
import {
  demoDonations,
  demoTransfers,
  demoUpdates,
  demoMedia,
} from '@/lib/demoData';
import type {
  Donation,
  Transfer,
  ImpactUpdate,
  MediaItem,
  FeedEntry,
  LiveStatus,
} from '@/lib/types';

export interface FeedResult<T> {
  items: T[];
  status: LiveStatus;
  isDemo: boolean;
}

interface UseFeedOptions {
  limit?: number;
  orderField?: string;
}

/** Generic bounded onSnapshot listener over one collection. */
export function useFeed<T extends { id: string }>(
  collectionName: string,
  { limit = 25, orderField = 'timestamp' }: UseFeedOptions = {},
): FeedResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<LiveStatus>(
    firebaseReady ? 'loading' : 'empty',
  );

  useEffect(() => {
    if (!firebaseReady || !db) return;
    const q = query(
      collection(db, collectionName),
      orderBy(orderField, 'desc'),
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
        setStatus(rows.length === 0 ? 'empty' : 'live');
      },
      (err) => {
        console.error(`[useFeed:${collectionName}] snapshot error:`, err);
        setStatus('error');
      },
    );
    return unsub;
  }, [collectionName, limit, orderField]);

  return { items, status, isDemo: !firebaseReady };
}

/** Demo combined feed, time-ordered, for the no-Firebase path. */
function demoCombinedFeed(limit: number): FeedEntry[] {
  const entries: FeedEntry[] = [
    ...demoDonations.map(
      (donation): FeedEntry => ({
        kind: 'donation',
        id: donation.id,
        ts: toMillis(donation.timestamp),
        donation,
      }),
    ),
    ...demoTransfers.map(
      (transfer): FeedEntry => ({
        kind: 'transfer',
        id: transfer.id,
        ts: toMillis(transfer.timestamp),
        transfer,
      }),
    ),
    ...demoUpdates.map(
      (update): FeedEntry => ({
        kind: 'update',
        id: update.id,
        ts: toMillis(update.timestamp),
        update,
      }),
    ),
    ...demoMedia.map(
      (media): FeedEntry => ({
        kind: 'photo',
        id: media.id,
        ts: toMillis(media.timestamp),
        media,
      }),
    ),
  ];
  return entries.sort((a, b) => b.ts - a.ts).slice(0, limit);
}

/**
 * Combined mixed feed across the four public collections, time-ordered
 * desc and capped at `limit`. Each collection is subscribed with its own
 * bounded listener (per-collection cap keeps reads cheap).
 */
export function useCombinedFeed(limit = 6): FeedResult<FeedEntry> {
  const perCollection = Math.max(limit, 8);
  const donations = useFeed<Donation>('donations', { limit: perCollection });
  const transfers = useFeed<Transfer>('transfers', { limit: perCollection });
  const updates = useFeed<ImpactUpdate>('updates', { limit: perCollection });
  const media = useFeed<MediaItem>('media', { limit: perCollection });

  const status: LiveStatus = useMemo(() => {
    const states = [donations.status, transfers.status, updates.status, media.status];
    if (states.includes('error')) return 'error';
    if (states.includes('loading')) return 'loading';
    if (states.every((s) => s === 'empty')) return 'empty';
    return 'live';
  }, [donations.status, transfers.status, updates.status, media.status]);

  const items = useMemo<FeedEntry[]>(() => {
    if (!firebaseReady) return demoCombinedFeed(limit);
    const entries: FeedEntry[] = [
      ...donations.items.map(
        (donation): FeedEntry => ({
          kind: 'donation',
          id: donation.id,
          ts: toMillis(donation.timestamp),
          donation,
        }),
      ),
      ...transfers.items.map(
        (transfer): FeedEntry => ({
          kind: 'transfer',
          id: transfer.id,
          ts: toMillis(transfer.timestamp),
          transfer,
        }),
      ),
      ...updates.items.map(
        (update): FeedEntry => ({
          kind: 'update',
          id: update.id,
          ts: toMillis(update.timestamp),
          update,
        }),
      ),
      ...media.items.map(
        (m): FeedEntry => ({
          kind: 'photo',
          id: m.id,
          ts: toMillis(m.timestamp),
          media: m,
        }),
      ),
    ];
    return entries.sort((a, b) => b.ts - a.ts).slice(0, limit);
  }, [donations.items, transfers.items, updates.items, media.items, limit]);

  return {
    items,
    status: firebaseReady ? status : 'live',
    isDemo: !firebaseReady,
  };
}
