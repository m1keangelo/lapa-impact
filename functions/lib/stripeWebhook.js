"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
/**
 * stripeWebhook — receives Stripe's `checkout.session.completed` event,
 * writes the donor + donation + global stat increment into Firestore, and
 * marks `stripeSessions/{session.id}` as confirmed so the success page can
 * pick up the generated donor code.
 *
 * All gifts pool into ONE fund — nothing is earmarked per donor.
 *
 * Secrets (set with `firebase functions:secrets:set …`):
 *   STRIPE_SECRET_KEY      — Stripe secret API key
 *   STRIPE_WEBHOOK_SECRET  — signing secret of this webhook endpoint (whsec_…)
 */
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("firebase-admin/auth");
const nanoid_1 = require("nanoid");
const stripe_1 = __importDefault(require("stripe"));
const STRIPE_SECRET_KEY = (0, params_1.defineSecret)('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = (0, params_1.defineSecret)('STRIPE_WEBHOOK_SECRET');
/** Donor codes: 6 numeric digits — matches the frontend regex. */
const newDonorCode = (0, nanoid_1.customAlphabet)('0123456789', 6);
function db() {
    if ((0, app_1.getApps)().length === 0)
        (0, app_1.initializeApp)();
    return (0, firestore_1.getFirestore)();
}
/**
 * If the donor already has a LAPA.Help account under this email, link the
 * gift to their uid so it appears in My Impact immediately (§35–37).
 */
async function donorUidForEmail(email) {
    if (!email)
        return null;
    try {
        if ((0, app_1.getApps)().length === 0)
            (0, app_1.initializeApp)();
        const user = await (0, auth_1.getAuth)().getUserByEmail(email);
        return user.uid;
    }
    catch {
        return null; // no account yet — linkMyDonations picks it up later
    }
}
exports.stripeWebhook = (0, https_1.onRequest)({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const stripe = new stripe_1.default(STRIPE_SECRET_KEY.value(), {
        apiVersion: '2024-11-20.acacia',
    });
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string') {
        res.status(400).send('Missing stripe-signature header');
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, signature, STRIPE_WEBHOOK_SECRET.value());
    }
    catch (err) {
        console.error('[stripeWebhook] signature verification failed:', err);
        res.status(400).send('Invalid signature');
        return;
    }
    if (event.type !== 'checkout.session.completed') {
        // Acknowledge other events so Stripe doesn't retry them here.
        res.status(200).json({ received: true, ignored: event.type });
        return;
    }
    const session = event.data.object;
    const firestore = db();
    // (a) Idempotency — Stripe retries webhooks; only process once.
    const sessionRef = firestore.collection('stripeSessions').doc(session.id);
    const existing = await sessionRef.get();
    if (existing.exists) {
        res.status(200).json({ received: true, duplicate: true });
        return;
    }
    const email = session.customer_details?.email ?? session.customer_email ?? undefined;
    const name = session.customer_details?.name?.trim() || 'Friend of LAPA';
    const amount = session.amount_total ?? 0; // integer cents already
    const donorUid = await donorUidForEmail(email);
    // (b) Find an existing donor by email, or mint a new code.
    let donorCode = null;
    if (email) {
        const snap = await firestore
            .collection('donors')
            .where('email', '==', email)
            .limit(1)
            .get();
        if (!snap.empty)
            donorCode = snap.docs[0].id;
    }
    if (!donorCode) {
        // 6-digit codes have a real collision chance — re-roll until free.
        for (;;) {
            const candidate = newDonorCode();
            const taken = await firestore.collection('donors').doc(candidate).get();
            if (!taken.exists) {
                donorCode = candidate;
                break;
            }
        }
    }
    const donorRef = firestore.collection('donors').doc(donorCode);
    const donorSnap = await donorRef.get();
    // (c) One batch: donation + donor total + global total + session marker.
    const batch = firestore.batch();
    if (!donorSnap.exists) {
        batch.set(donorRef, {
            code: donorCode,
            name,
            ...(email ? { email } : {}),
            totalGiven: amount,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
    }
    else {
        batch.update(donorRef, {
            totalGiven: firestore_1.FieldValue.increment(amount),
        });
    }
    const donationRef = firestore.collection('donations').doc();
    batch.set(donationRef, {
        donorCode,
        amount,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        // PII stays out of this public-read doc — email lives only in
        // donors/ + stripeSessions/ (rules-closed); the account link is the uid.
        ...(donorUid ? { donorUid } : {}),
        donorName: name,
        stripeSessionId: session.id,
        source: session.metadata?.type === 'ticket' ? 'ticket' : 'stripe',
    });
    const statsRef = firestore.collection('stats').doc('global');
    batch.set(statsRef, {
        totalIn: firestore_1.FieldValue.increment(amount),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    batch.set(sessionRef, {
        code: donorCode,
        status: 'confirmed',
        donationId: donationRef.id,
        ...(email ? { email } : {}),
        ...(donorUid ? { donorUid } : {}),
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    await batch.commit();
    // Mini-campaign attribution (additive): when the checkout session
    // carries metadata.campaignId, move that campaign's progress bar by
    // the confirmed amount — and mark it completed when the goal is met.
    // Money still pools into the single fund; this is bookkeeping only.
    const campaignId = session.metadata?.campaignId;
    if (typeof campaignId === 'string' && campaignId.length > 0 && amount > 0) {
        try {
            const campRef = firestore.collection('campaigns').doc(campaignId);
            await firestore.runTransaction(async (tx) => {
                const snap = await tx.get(campRef);
                if (!snap.exists)
                    return;
                const camp = snap.data();
                const raised = (camp.raisedCents ?? 0) + amount;
                const goal = camp.goalCents ?? 0;
                tx.update(campRef, {
                    raisedCents: raised,
                    ...(camp.status === 'active' && goal > 0 && raised >= goal
                        ? { status: 'completed', completedAt: firestore_1.FieldValue.serverTimestamp() }
                        : {}),
                });
            });
            console.log(`[stripeWebhook] campaign ${campaignId} += ${amount}¢`);
        }
        catch (err) {
            // Never fail the webhook over attribution — the gift is recorded.
            console.error('[stripeWebhook] campaign increment failed:', err);
        }
    }
    console.log(`[stripeWebhook] recorded ${amount}¢ from session ${session.id} → donor ${donorCode}`);
    res.status(200).json({ received: true });
});
//# sourceMappingURL=stripeWebhook.js.map