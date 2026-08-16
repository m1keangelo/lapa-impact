/**
 * Live mini-campaigns — onSnapshot on campaigns/ (public read).
 * 4 designed states; falls back to clearly-labeled demo campaigns when
 * Firebase is not configured or the site is in preview mode.
 * SDK loads lazily (firebaseCore) — the homepage bundle stays light.
 */
import { useEffect, useState } from 'react';
import { firebaseReady, getDb } from '@/lib/firebaseCore';
import { usePublicMode } from '@/hooks/usePublicMode';
import { demoCampaigns } from '@/lib/demoData';
import type { Campaign, LiveStatus } from '@/lib/types';

export interface CampaignsResult {
  campaigns: Campaign[];
  status: LiveStatus;
  /** true when serving bundled demo data */
  isDemo: boolean;
}

export function useCampaigns(): CampaignsResult {
  const { mode } = usePublicMode();
  const isDemo = !firebaseReady || mode === 'preview';
  const [campaigns, setCampaigns] = useState<Campaign[]>(
    isDemo ? demoCampaigns : [],
  );
  const [status, setStatus] = useState<LiveStatus>(
    isDemo ? 'live' : 'loading',
  );

  useEffect(() => {
    if (!firebaseReady) return;
    if (mode === 'preview') {
      setCampaigns(demoCampaigns);
      setStatus('live');
      return;
    }
    let cancelled = false;
    let unsub: (() => void) | undefined;
    void (async () => {
      const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')]);
      if (cancelled || !db) return;
      unsub = fs.onSnapshot(
        fs.collection(db, 'campaigns'),
        (snap) => {
          const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign);
          // Active first, then completed; 'order' ascending within each.
          all.sort((a, b) => {
            const sa = a.status === 'active' ? 0 : 1;
            const sb = b.status === 'active' ? 0 : 1;
            if (sa !== sb) return sa - sb;
            return (a.order ?? 99) - (b.order ?? 99);
          });
          setCampaigns(all);
          setStatus(all.length === 0 ? 'empty' : 'live');
        },
        () => setStatus('error'),
      );
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [mode]);

  return { campaigns, status, isDemo };
}
