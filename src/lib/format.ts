/**
 * Display formatting helpers (design.md §8).
 * Money is always integer cents; timestamps normalize to epoch millis.
 * Locale-dependent helpers accept an optional 'en' | 'es' language
 * (default 'en') — callers pass the value from useLanguage().
 */
import type { TimestampLike } from './types';

export type DisplayLang = 'en' | 'es';

const LOCALES: Record<DisplayLang, string> = { en: 'en-US', es: 'es-CO' };

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
 * Relative under 48h ("just now", "20m ago", "2h ago" / "justo ahora",
 * "hace 20m", "hace 2h"), absolute after ("Mar 4" / "4 mar").
 * Mono + caption size is applied by callers.
 */
export function formatRelativeTime(ts: TimestampLike, lang: DisplayLang = 'en'): string {
  const ms = toMillis(ts);
  if (!ms) return '';
  const diff = Date.now() - ms;
  const abs = new Date(ms);
  const HOURS = 60 * 60 * 1000;

  if (diff < 60 * 1000) return lang === 'es' ? 'justo ahora' : 'just now';
  if (diff < HOURS) {
    const m = Math.floor(diff / 60000);
    return lang === 'es' ? `hace ${m}m` : `${m}m ago`;
  }
  if (diff < 48 * HOURS) {
    const h = Math.floor(diff / HOURS);
    return lang === 'es' ? `hace ${h}h` : `${h}h ago`;
  }
  const sameYear = abs.getFullYear() === new Date().getFullYear();
  return abs.toLocaleDateString(LOCALES[lang], {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/**
 * Picks the Spanish version of a Firestore text field when the visitor's
 * language is Spanish and the translateContent function has stored a
 * translation (`note` → `noteEs`, etc.). Falls back to the original.
 */
export function pickLang<T extends object>(
  obj: T,
  field: keyof T & string,
  lang: DisplayLang,
): string {
  const rec = obj as Record<string, unknown>;
  const esValue = lang === 'es' ? rec[`${field}Es`] : undefined;
  const value = typeof esValue === 'string' && esValue.trim() ? esValue : rec[field];
  return typeof value === 'string' ? value : '';
}

/** Same as pickLang but for the metrics record of an impact update. */
export function pickMetrics<
  T extends { metrics?: Record<string, string | number>; metricsEs?: Record<string, string | number> },
>(obj: T, lang: DisplayLang): Record<string, string | number> {
  const es = lang === 'es' ? obj.metricsEs : undefined;
  return es && Object.keys(es).length > 0 ? es : (obj.metrics ?? {});
}

/**
 * Donor privacy display name (design.md §8): first name + last initial.
 * "Maria García" → "Maria G."  ·  "Priya" → "Priya"
 */
export function privacyName(
  fullName: string | null | undefined,
  lang: DisplayLang = 'en',
): string {
  const fallback = lang === 'es' ? 'Anónimo' : 'Anonymous';
  if (!fullName) return fallback;
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${parts[0]} ${lastInitial}.`;
}
