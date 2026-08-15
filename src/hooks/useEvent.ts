/**
 * useEvent — the public event hook (FINAL(2) PART 54/70).
 *
 * Firestore `events/current` is the source of truth. When the document
 * does not exist yet (nobody has pressed Publish in Admin → Events), the
 * hook falls back to SEED_EVENT — which contains only confirmed,
 * organizer-supplied facts, so the page is never wrong and never empty.
 */
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SEED_EVENT, type EventDoc } from '@/lib/eventData';

export interface EventState {
  event: EventDoc;
  /** 'live' = published from admin; 'seed' = confirmed-facts fallback. */
  source: 'live' | 'seed';
  loading: boolean;
}

export function useEvent(): EventState {
  const [remote, setRemote] = useState<EventDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'events', 'current'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as Partial<EventDoc>;
          // Merge over the seed so a partially-filled doc never breaks
          // the public page — missing fields keep their confirmed values.
          setRemote({ ...SEED_EVENT, ...data, status: 'published' });
        } else {
          setRemote(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[useEvent] listener failed:', err);
        setRemote(null);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  return {
    event: remote ?? SEED_EVENT,
    source: remote ? 'live' : 'seed',
    loading,
  };
}
