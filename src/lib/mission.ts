/**
 * Mission-day system (live ground-zero spec §3, §18).
 *
 * Every public entry — donation, purchase, delivery, field report, photo —
 * belongs to a mission day. Day 1 is the calendar day of the disaster in
 * the campaign's local timezone (Colombia, UTC-5 — no DST, so a fixed
 * offset is exact). The public STORY view groups everything by day; the
 * backend assigns the day automatically at publish time.
 */
import { CAMPAIGN } from './campaign';

/** Milliseconds since epoch of the mission start moment. */
export const MISSION_START_MS: number = new Date(CAMPAIGN.missionStartIso).getTime();

/**
 * Mission day for a timestamp — Day 1 = the calendar day containing the
 * mission start, counted in the campaign timezone. Returns 0 for anything
 * before the mission began.
 */
export function missionDay(ts: number): number {
  const offsetMs = -5 * 3600 * 1000; // America/Bogota — fixed UTC-5
  const dayMs = 86400000;
  const startDay = Math.floor((MISSION_START_MS + offsetMs) / dayMs);
  const entryDay = Math.floor((ts + offsetMs) / dayMs);
  const day = entryDay - startDay + 1;
  return day >= 1 ? day : 0;
}

/** Today's mission day (for headers like "DÍA 5 — HOY"). */
export function currentMissionDay(now: number = Date.now()): number {
  return missionDay(now);
}

/** "DÍA 3 · 12 ago" / "DAY 3 · Aug 12" — localized day heading. */
export function missionDayLabel(day: number, lang: 'en' | 'es'): string {
  const offsetMs = -5 * 3600 * 1000;
  const dayMs = 86400000;
  const startDay = Math.floor((MISSION_START_MS + offsetMs) / dayMs);
  const date = new Date((startDay + (day - 1)) * dayMs - offsetMs);
  const dateStr = date.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Bogota',
  });
  return `${lang === 'es' ? 'Día' : 'Day'} ${day} · ${dateStr}`;
}
