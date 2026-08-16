/**
 * Preview / Live / Paused — the admin-controlled launch mode (final doc §6–13).
 *
 * `settings/public` { mode: 'preview' | 'live' | 'paused', updatedAt, updatedBy }
 *
 * - preview: the public site shows clearly-labeled bundled demo content so
 *   visitors can see how the ledger works BEFORE the campaign launches.
 * - live:    only real, approved Firestore activity appears publicly.
 * - paused:  real data keeps showing; the admin has deliberately paused
 *   public publishing (new records stop appearing — a human decision,
 *   never automatic). Returning to preview is a separate deliberate act.
 *
 * The mode is NEVER inferred from donation counts, amounts, or time — the
 * administrator decides when there is enough meaningful real activity.
 *
 * When Firebase is unconfigured or the doc doesn't exist yet, we default
 * to 'preview' (the safe, labeled state).
 *
 * The SDK is loaded lazily (firebaseCore) so the homepage bundle does not
 * carry Firestore (PERFORMANCE §44).
 */
import { useEffect, useState } from 'react';
import { firebaseReady, getDb } from '@/lib/firebaseCore';

export type PublicMode = 'preview' | 'live' | 'paused';

export interface PublicModeState {
  mode: PublicMode;
  /** false until the first settings snapshot arrives (or Firebase is off) */
  ready: boolean;
}

export function usePublicMode(): PublicModeState {
  const [state, setState] = useState<PublicModeState>({
    mode: 'preview',
    ready: !firebaseReady,
  });

  useEffect(() => {
    if (!firebaseReady) return;
    let cancelled = false;
    let unsub: (() => void) | undefined;
    void (async () => {
      const [db, fs] = await Promise.all([getDb(), import('firebase/firestore')]);
      if (cancelled || !db) return;
      unsub = fs.onSnapshot(
        fs.doc(db, 'settings', 'public'),
        (snap) => {
          const mode = snap.data()?.mode;
          setState({
            mode:
              mode === 'live' || mode === 'paused' || mode === 'preview'
                ? mode
                : 'preview',
            ready: true,
          });
        },
        (err) => {
          console.error('[usePublicMode] snapshot error:', err);
          // Stay on the safe default rather than flashing real/empty data.
          setState({ mode: 'preview', ready: true });
        },
      );
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  return state;
}
