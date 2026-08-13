/**
 * Display formatting helpers (design.md §8).
 * Money is always integer cents; timestamps normalize to epoch millis.
 */
import type { TimestampLike } from './types';

/** Normalize any timestamp representation to epoch millis. */
export function toMillis(ts: TimestampLike | null | undefined): number {
  if (ts == null) return 0;
  if (typeof ts === 'number') return ts;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  return 0;
}

/** "$1,250.00" from integer cents. */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Hero-stat money: full precision below $1M, abbreviated above
 * ("$1.2M") — desktop hero only per design.md §8.
 */
export function formatMoneyShort(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    const m = dollars / 1_000_000;
    return `$${m >= 10 ? Math.round(m) : m.toFixed(1)}M`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(dollars);
}

/** Plain grouped number for counts, e.g. "312". */
export function formatCount(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

/**
 * Relative under 48h ("just now", "20m ago", "2h ago"),
 * absolute after ("Mar 4"). Mono + caption size is applied by callers.
 */
export function formatRelativeTime(ts: TimestampLike): string {
  const ms = toMillis(ts);
  if (!ms) return '';
  const diff = Date.now() - ms;
  const abs = new Date(ms);
  const HOURS = 60 * 60 * 1000;

  if (diff < 60 * 1000) return 'just now';
  if (diff < HOURS) {
    const m = Math.floor(diff / 60000);
    return `${m}m ago`;
  }
  if (diff < 48 * HOURS) {
    const h = Math.floor(diff / HOURS);
    return `${h}h ago`;
  }
  const sameYear = abs.getFullYear() === new Date().getFullYear();
  return abs.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Donor privacy display name (design.md §8): first name + last initial.
 * "Maria García" → "Maria G."  ·  "Priya" → "Priya"
 */
export function privacyName(fullName: string | null | undefined): string {
  if (!fullName) return 'Anonymous';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Anonymous';
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${parts[0]} ${lastInitial}.`;
}
