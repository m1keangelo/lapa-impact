/**
 * Non-component form utilities for the admin workbench (kept separate from
 * fields.tsx so that file only exports components — react-refresh rule).
 */

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
