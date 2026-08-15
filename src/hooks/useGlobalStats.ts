/**
 * Live global stats — onSnapshot on stats/global with the 4 designed
 * states (loading / empty / error / live). Falls back to demo data when
 * Firebase is not configured so the landing page renders fully.
 */
import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, firebaseReady } from '@/lib/firebase';
import { usePublicMode } from '@/hooks/usePublicMode';
import { demoStats } from '@/lib/demoData';
import type { GlobalStats, LiveStatus } from '@/lib/types';

export interface GlobalStatsResult {
  stats: GlobalStats;
  status: LiveStatus;
  /** true when serving bundled demo data (no Firebase configured) */
  isDemo: boolean;
  /** bumped on each live push after the first — use to trigger pulse FX */
  revision: number;
}

const ZERO_STATS: GlobalStats = { totalIn: 0, totalOut: 0, familiesHelped: 0 };

export function useGlobalStats(): GlobalStatsResult {
  const { mode } = usePublicMode();
  // Preview mode serves the bundled demo stats — clearly labeled — even
  // when Firebase is live (final doc §6–13). 'live'/'paused' show real.
  const isDemo = !firebaseReady || mode === 'preview';
  const [stats, setStats] = useState<GlobalStats>(
    isDemo ? demoStats : ZERO_STATS,
  );
  const [status, setStatus] = useState<LiveStatus>(
    isDemo ? 'live' : 'loading',
  );
  // Bumped whenever a live value changes — lets consumers flash a pulse.
  const [revision, setRevision] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    if (!firebaseReady || !db) return;
    if (mode === 'preview') {
      // Back to clearly-labeled demo content; detach from real stats.
      setStats(demoStats);
      setStatus('live');
      return;
    }
    const ref = doc(db, 'stats', 'global');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setStats(ZERO_STATS);
          setStatus('empty');
          return;
        }
        const data = snap.data() as Partial<GlobalStats>;
        setStats({
          totalIn: data.totalIn ?? 0,
          totalOut: data.totalOut ?? 0,
          familiesHelped: data.familiesHelped ?? 0,
          updatedAt: data.updatedAt,
        });
        setStatus('live');
        if (!first.current) setRevision((r) => r + 1);
        first.current = false;
      },
      (err) => {
        console.error('[useGlobalStats] snapshot error:', err);
        setStatus('error');
      },
    );
    return unsub;
  }, [mode]);

  return { stats, status, isDemo, revision };
}
