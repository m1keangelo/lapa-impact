/**
 * Donation entry points — Stripe Payment Links take the money; the
 * lookupDonation Cloud Function hands back the donor code after checkout.
 * Both values are optional env-driven config: when unset, donate UI hides
 * or degrades to a graceful demo/unavailable state.
 */

const clean = (v: unknown): string | null =>
  typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

/** Stripe Payment Link URL (https://buy.stripe.com/…). Null → hide Donate CTAs. */
export const STRIPE_PAYMENT_LINK: string | null = clean(
  import.meta.env.VITE_STRIPE_PAYMENT_LINK,
);

/**
 * Base URL of the deployed Cloud Functions region
 * (e.g. https://us-central1-<project>.cloudfunctions.net).
 * Null → /donate/success shows the unavailable state.
 */
export const FUNCTIONS_BASE_URL: string | null = clean(
  import.meta.env.VITE_FUNCTIONS_BASE_URL,
);
