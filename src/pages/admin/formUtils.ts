/**
 * Non-component form utilities for the admin workbench (kept separate from
 * fields.tsx so that file only exports components — react-refresh rule).
 */
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DONOR_CODE_LENGTH, isPlausibleDonorCode } from '@/lib/session';
import type { Donor } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Styling primitives                                                   */
/* ------------------------------------------------------------------ */

export const inputCls =
  'h-12 w-full rounded-[10px] border border-border bg-surface-2 px-4 text-[15px] text-text placeholder:text-text-faint transition-colors duration-150 ease-calm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/40';

export const textareaCls =
  'w-full rounded-[10px] border border-border bg-surface-2 px-4 py-3 text-[15px] leading-[1.55] text-text placeholder:text-text-faint transition-colors duration-150 ease-calm focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/40';

/* ------------------------------------------------------------------ */
/* Money — dollars in the UI, integer cents in Firestore                */
/* ------------------------------------------------------------------ */

/** "50" / "50.25" → 5000 / 5025 cents. NaN-safe (returns 0). */
export function dollarsToCents(value: string): number {
  const n = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

/* ------------------------------------------------------------------ */
/* Submit button state                                                  */
/* ------------------------------------------------------------------ */

export type SaveState = 'idle' | 'saving' | 'saved';

/* ------------------------------------------------------------------ */
/* Donor code lookup                                                    */
/* ------------------------------------------------------------------ */

export type DonorLookupState = 'idle' | 'invalid' | 'checking' | 'found' | 'notfound';

export interface DonorLookup {
  state: DonorLookupState;
  donor: Donor | null;
}

interface LookupResult {
  code: string;
  state: 'found' | 'notfound';
  donor: Donor | null;
}

/**
 * Debounced getDoc(donors/{code}) once the input is a plausible 6-digit
 * code. State is derived during render; the effect only schedules the
 * async fetch (no synchronous setState in the effect body).
 */
export function useDonorLookup(code: string): DonorLookup {
  const trimmed = code.trim();
  const eligible = isPlausibleDonorCode(trimmed);
  const [result, setResult] = useState<LookupResult | null>(null);

  useEffect(() => {
    if (!eligible) return;
    const timer = setTimeout(async () => {
      if (!db) {
        setResult({ code: trimmed, state: 'notfound', donor: null });
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'donors', trimmed));
        if (snap.exists()) {
          setResult({ code: trimmed, state: 'found', donor: snap.data() as Donor });
        } else {
          setResult({ code: trimmed, state: 'notfound', donor: null });
        }
      } catch (err) {
        console.error('[donor-lookup] getDoc failed:', err);
        setResult({ code: trimmed, state: 'notfound', donor: null });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [trimmed, eligible]);

  if (trimmed.length < DONOR_CODE_LENGTH) return { state: 'idle', donor: null };
  if (!eligible) return { state: 'invalid', donor: null };
  if (result && result.code === trimmed) {
    return { state: result.state, donor: result.donor };
  }
  return { state: 'checking', donor: null };
}
