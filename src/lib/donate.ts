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

/** The site can take money when either checkout path is configured. */
export const CHECKOUT_AVAILABLE = Boolean(STRIPE_PAYMENT_LINK || FUNCTIONS_BASE_URL);

/**
 * Starts on-site checkout: asks the createCheckoutSession function for a
 * Stripe Checkout URL and redirects there. Falls back to the fixed Payment
 * Link while the functions are not deployed yet.
 */
export async function startCheckout(
  type: 'donation' | 'ticket',
  amountCents?: number,
  /** optional mini-campaign attribution — the webhook increments its bar */
  campaignId?: string,
): Promise<void> {
  if (FUNCTIONS_BASE_URL) {
    const res = await fetch(`${FUNCTIONS_BASE_URL}/createCheckoutSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amountCents, ...(campaignId ? { campaignId } : {}) }),
    });
    if (!res.ok) throw new Error(`checkout_failed:${res.status}`);
    const data = (await res.json()) as { url?: string };
    if (data.url) {
      window.location.assign(data.url);
      return;
    }
    throw new Error('checkout_failed:no_url');
  }
  if (STRIPE_PAYMENT_LINK) {
    window.location.assign(STRIPE_PAYMENT_LINK);
    return;
  }
  throw new Error('checkout_unavailable');
}
