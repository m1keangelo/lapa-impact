"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutSession = void 0;
/**
 * createCheckoutSession — on-site checkout for LAPA.Help.
 *
 * The site's donate page POSTs here and gets back a Stripe Checkout URL:
 *
 *   POST { "type": "ticket" }                      → the fixed $25 ticket
 *   POST { "type": "donation", "amountCents": 5000 } → any amount ≥ $1
 *
 * Amounts are ALWAYS computed/validated server-side — the client can never
 * set the ticket price, and donations are clamped to sane bounds. Every
 * session carries metadata.type so the stripeWebhook function can tag the
 * gift's source when it lands.
 *
 * Secrets (set with `firebase functions:secrets:set …`):
 *   STRIPE_SECRET_KEY — Stripe secret API key
 */
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const stripe_1 = __importDefault(require("stripe"));
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
/** $25 solidarity ticket — fixed server-side. */
const TICKET_PRICE_CENTS = 2500;
const MIN_DONATION_CENTS = 100; // $1
const MAX_DONATION_CENTS = 10000000; // $100,000 safety ceiling
/** Public site origin — used for success/cancel return URLs. */
const SITE_URL = (process.env.SITE_URL ?? 'https://lapa-impact.vercel.app').replace(/\/$/, '');
exports.createCheckoutSession = (0, https_1.onRequest)({ cors: true, secrets: [STRIPE_SECRET_KEY] }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const body = (req.body ?? {});
    const type = body.type === 'ticket' ? 'ticket' : 'donation';
    // Optional mini-campaign attribution — bounded string, passes through
    // to session metadata; the stripeWebhook increments that campaign's bar.
    const campaignId = typeof body.campaignId === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(body.campaignId)
        ? body.campaignId
        : null;
    let amountCents;
    if (type === 'ticket') {
        amountCents = TICKET_PRICE_CENTS;
    }
    else {
        const raw = Number(body.amountCents);
        if (!Number.isInteger(raw) || raw < MIN_DONATION_CENTS || raw > MAX_DONATION_CENTS) {
            res.status(400).json({ error: 'invalid_amount' });
            return;
        }
        amountCents = raw;
    }
    const stripe = new stripe_1.default(STRIPE_SECRET_KEY.value(), {
        apiVersion: '2024-11-20.acacia',
    });
    try {
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'usd',
                        unit_amount: amountCents,
                        product_data: {
                            name: type === 'ticket'
                                ? 'LAPA.Help — Solidarity Ticket'
                                : 'LAPA.Help — Donation',
                        },
                    },
                },
            ],
            metadata: { type, ...(campaignId ? { campaignId } : {}) },
            success_url: `${SITE_URL}/donate/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${SITE_URL}/donate`,
        });
        res.status(200).json({ url: session.url });
    }
    catch (err) {
        console.error('[createCheckoutSession] failed:', err);
        res.status(500).json({ error: 'checkout_failed' });
    }
});
//# sourceMappingURL=createCheckoutSession.js.map