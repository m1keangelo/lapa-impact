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
};

/** "🇨🇴 Colombia · 2026" — eyebrow lockup, language-aware. */
export function campaignEyebrow(lang: 'en' | 'es'): string {
  const country = lang === 'es' ? CAMPAIGN.countryEs : CAMPAIGN.country;
  return `${CAMPAIGN.flag} ${country} · ${CAMPAIGN.campaignYear}`;
}
