/**
 * Campaign-country system (one-pass master §11–12).
 *
 * LAPA.Help is the permanent platform — logo, typography, layout, colors
 * and navigation never change. The current COUNTRY is a campaign skin:
 * when the mission moves (Puerto Rico, Mexico, Venezuela…), only the
 * values in this file change. Nothing else gets redesigned.
 */
export interface Campaign {
  /** Human-readable country name, English display form. */
  country: string;
  /** Country name in Spanish. */
  countryEs: string;
  /** ISO 3166-1 alpha-2. */
  countryCode: string;
  /** Flag emoji used as the small campaign marker. */
  flag: string;
  /** Campaign label, e.g. "Colombia · 2026". */
  campaignName: string;
  campaignYear: string;
  /** Current mission location used in field context. */
  location: string;
  locationEs: string;
  /** Hero / donate imagery for this campaign. */
  heroImage: string;
  donateImage: string;
  /**
   * ISO timestamp of the moment the mission began (the disaster event).
   * Mission Day 1 = the calendar day containing this moment, in the
   * campaign's local timezone. Drives the DÍA 1 / DAY 1 story timeline.
   */
  missionStartIso: string;
  /**
   * Ground-zero locations for this mission (English / Spanish display).
   * Used by the finance + field consoles and shown as location chips.
   */
  locations: { id: string; en: string; es: string }[];
}

export const CAMPAIGN: Campaign = {
  country: 'Colombia',
  countryEs: 'Colombia',
  countryCode: 'CO',
  flag: '🇨🇴',
  campaignName: 'Colombia · 2026',
  campaignYear: '2026',
  location: 'Chocó, Colombia',
  locationEs: 'Chocó, Colombia',
  heroImage: '/hero-andes.jpg',
  donateImage: '/hero-andes.jpg',
  // M7.4 — 10 Aug 2026, 07:34 Colombia time (UTC-5), San José del Palmar, Chocó.
  missionStartIso: '2026-08-10T07:34:00-05:00',
  locations: [
    { id: 'pereira', en: 'Pereira', es: 'Pereira' },
    { id: 'armenia', en: 'Armenia', es: 'Armenia' },
    { id: 'cali', en: 'Cali', es: 'Cali' },
    { id: 'quibdo', en: 'Quibdó', es: 'Quibdó' },
    { id: 'manizales', en: 'Manizales', es: 'Manizales' },
    { id: 'san-jose-del-palmar', en: 'San José del Palmar', es: 'San José del Palmar' },
    { id: 'choco', en: 'Chocó (rural)', es: 'Chocó (rural)' },
    { id: 'eje-cafetero', en: 'Eje Cafetero (other)', es: 'Eje Cafetero (otro)' },
  ],
};

/** "🇨🇴 Colombia · 2026" — eyebrow lockup, language-aware. */
export function campaignEyebrow(lang: 'en' | 'es'): string {
  const country = lang === 'es' ? CAMPAIGN.countryEs : CAMPAIGN.country;
  return `${CAMPAIGN.flag} ${country} · ${CAMPAIGN.campaignYear}`;
}

/* ─── Fundraiser event (master §40–44) ─────────────────────────────── */

export interface EventBusiness {
  name: string;
  /** What they're contributing, bilingual. */
  gives: { en: string; es: string };
  /** Category tag, bilingual (Service/Prize, Marketing, Venue + Proceeds…). */
  kind: { en: string; es: string };
}

export interface MissionEvent {
  /**
   * Null until the organizer confirms — the page renders a clearly marked
   * PENDING chip instead of ever inventing details (§44).
   */
  title: string | null;
  dateLabel: { en: string; es: string } | null;
  timeLabel: string | null;
  locationLabel: string | null;
  /** Solidarity ticket price, integer cents (§41: $25). */
  ticketPriceCents: number;
  /**
   * Confirmed local businesses (§43). A business only appears here once
   * the organizer confirms it — this list is the source of truth.
   */
  businesses: EventBusiness[];
}

export const EVENT: MissionEvent = {
  title: null, // PENDING — event name to be confirmed
  dateLabel: null, // PENDING — date to be confirmed
  timeLabel: null, // PENDING — time to be confirmed
  locationLabel: null, // PENDING — location to be confirmed
  ticketPriceCents: 2500,
  businesses: [
    {
      name: 'BETO AUTO REPAIR',
      gives: { en: 'A one-year oil change for five winners.', es: 'Un año de cambios de aceite para cinco ganadores.' },
      kind: { en: 'Service · Prize', es: 'Servicio · Premio' },
    },
    {
      name: 'THINK LOGIC',
      gives: { en: 'Event shirts and in-kind event support.', es: 'Camisetas del evento y apoyo en especie.' },
      kind: { en: 'Merchandise · In-kind', es: 'Mercancía · En especie' },
    },
    {
      name: 'CASA REAL',
      gives: { en: 'Marketing support.', es: 'Apoyo de marketing.' },
      kind: { en: 'Marketing', es: 'Marketing' },
    },
    {
      name: 'M STREET MORTGAGE',
      gives: { en: 'Helping host the event.', es: 'Ayuda como anfitrión del evento.' },
      kind: { en: 'Event · Hosting', es: 'Evento · Anfitrión' },
    },
    {
      name: 'DJ FLACO',
      gives: { en: 'Marketing and promotion support.', es: 'Apoyo de marketing y promoción.' },
      kind: { en: 'Marketing · Promotion', es: 'Marketing · Promoción' },
    },
    {
      name: 'DJ DANNY',
      gives: { en: 'Marketing and event support.', es: 'Apoyo de marketing y del evento.' },
      kind: { en: 'Marketing · Promotion', es: 'Marketing · Promoción' },
    },
    {
      name: 'LA LOCO',
      gives: { en: 'Event space, plus a portion of food and beverage proceeds supporting the Colombia mission.', es: 'El espacio del evento, más una parte de lo recaudado en comida y bebida para la misión en Colombia.' },
      kind: { en: 'Venue · Proceeds', es: 'Lugar · Recaudación' },
    },
  ],
};
