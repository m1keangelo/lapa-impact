/**
 * Event system (FINAL(2) PART 54/61/70/96) — the Firestore `events/current`
 * document is the source of truth for the public /event page. Nothing about
 * the event is hard-coded into components.
 *
 * SEED_EVENT holds ONLY the confirmed, organizer-supplied facts
 * (PART 61/112: "Use only confirmed supplied facts. Do NOT invent extra
 * performers, sponsors, prizes, businesses or claims."). It serves two jobs:
 *   1. Pre-fill for the Admin → Events editor, so publishing is one click.
 *   2. Fallback render for the public page before the first publish —
 *      safe because it contains nothing but confirmed facts.
 *
 * The public page reads Firestore first (useEvent). Admin edits are
 * primary-admin only (PART 69/109).
 */
import type { EventBusiness } from '@/lib/campaign';
import { STRIPE_PAYMENT_LINK } from '@/lib/donate';

export interface LocalText {
  en: string;
  es: string;
}

export interface EventPerformer {
  name: string;
  role: LocalText;
}

export interface EventDoc {
  title: LocalText;
  dateLabel: LocalText;
  timeLabel: LocalText;
  venueName: string;
  address: string;
  /** Solidarity ticket price, integer cents ($25). */
  ticketPriceCents: number;
  /** Where the ticket button points (Stripe Payment Link). */
  ticketUrl: string | null;
  /** Real event photo or poster URL — null until one exists (PART 70).
      Legacy single poster; superseded by imageEn / imageEs. */
  image: string | null;
  /** Poster shown to English visitors (left column in Admin → Medios). */
  imageEn?: string | null;
  /** Poster shown to Spanish visitors (right column in Admin → Medios). */
  imageEs?: string | null;
  performers: EventPerformer[];
  /** What's happening — short bilingual chips (Food, Drinks, Raffles…). */
  features: LocalText[];
  /** Confirmed local businesses showing up (source of truth list). */
  businesses: EventBusiness[];
  status: 'published';
}

/** Confirmed facts only — Grand Opening & Fundraiser, Aug 22 2026, DC. */
export const SEED_EVENT: EventDoc = {
  title: {
    en: 'Grand Opening & Fundraiser',
    es: 'Gran inauguración y recaudación',
  },
  dateLabel: {
    en: 'Saturday, August 22, 2026',
    es: 'Sábado, 22 de agosto de 2026',
  },
  timeLabel: {
    en: '5:00 PM — until the last dance',
    es: '5:00 p. m. — hasta el último baile',
  },
  venueName: 'La Loca Mexican Restaurant',
  address: '1018 Rhode Island Ave NW, Washington, DC',
  ticketPriceCents: 2500,
  ticketUrl: STRIPE_PAYMENT_LINK,
  image: null,
  imageEn: null,
  imageEs: null,
  performers: [
    { name: 'DJ Flaco', role: { en: 'Music', es: 'Música' } },
    { name: 'DJ Danny', role: { en: 'Music', es: 'Música' } },
  ],
  features: [
    { en: 'Food', es: 'Comida' },
    { en: 'Drinks', es: 'Bebidas' },
    { en: 'Happy hour', es: 'Hora feliz' },
    { en: 'Raffles', es: 'Rifas' },
  ],
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
      name: 'LA LOCA',
      gives: { en: 'Event space, plus a portion of food and beverage proceeds supporting the Colombia mission.', es: 'El espacio del evento, más una parte de lo recaudado en comida y bebida para la misión en Colombia.' },
      kind: { en: 'Venue · Proceeds', es: 'Lugar · Recaudación' },
    },
  ],
  status: 'published',
};

/**
 * Poster for the visitor's language: the matching side first, then the
 * other language, then the legacy single poster. Null = show the blue
 * date tile instead.
 */
export function eventImageFor(event: EventDoc, lang: 'en' | 'es'): string | null {
  if (lang === 'es') return event.imageEs ?? event.imageEn ?? event.image ?? null;
  return event.imageEn ?? event.imageEs ?? event.image ?? null;
}
