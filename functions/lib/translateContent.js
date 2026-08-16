"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateMedia = exports.translateUpdate = exports.translateTransfer = exports.translateDonation = void 0;
/**
 * translateContent — keeps the public ledger Spanish-first.
 *
 * Every donation note, transfer, impact update and photo caption that lands
 * in Firestore is checked the moment it is created. If the text is not
 * Spanish, it is translated into clear, general Latin American Spanish
 * (Colombian register) and stored next to the original in `*Es` fields:
 *
 *   donations/{id}:  note            → noteEs
 *   transfers/{id}:  recipient       → recipientEs
 *                    purpose         → purposeEs
 *   updates/{id}:    title           → titleEs
 *                    body            → bodyEs
 *                    metrics (keys)  → metricsEs
 *   media/{id}:      caption         → captionEs
 *
 * The frontend shows the `*Es` version whenever the visitor's language is
 * Spanish and falls back to the original otherwise. Documents already in
 * Spanish are left untouched (detected via the Translation API).
 *
 * Requires: Cloud Translation API enabled on the GCP project (one click in
 * the Google Cloud console — included in the Blaze free tier allowance).
 * Uses the default function service-account credentials; no extra secrets.
 */
const firestore_1 = require("firebase-functions/v2/firestore");
const app_1 = require("firebase-admin/app");
const v2_1 = require("@google-cloud/translate/build/src/v2");
if ((0, app_1.getApps)().length === 0)
    (0, app_1.initializeApp)();
const translate = new v2_1.Translate();
const TARGET = 'es';
/** Translates one string to Spanish. Returns null when already Spanish. */
async function toSpanish(text) {
    if (typeof text !== 'string')
        return null;
    const trimmed = text.trim();
    if (trimmed.length < 3)
        return null; // names, initials, numbers — leave alone
    try {
        const [detection] = await translate.detect(trimmed);
        const detected = typeof detection === 'object' && detection !== null && 'language' in detection
            ? detection.language
            : undefined;
        if (detected?.toLowerCase().startsWith(TARGET))
            return null; // already Spanish
        const [translated] = await translate.translate(trimmed, {
            from: detected,
            to: TARGET,
        });
        const out = typeof translated === 'string' ? translated.trim() : '';
        return out.length > 0 && out !== trimmed ? out : null;
    }
    catch (err) {
        // Never block a write because translation failed — log and move on.
        console.error('[translateContent] translation failed:', err);
        return null;
    }
}
/** Translates the values of a metrics object (keys are display labels). */
async function metricsToSpanish(metrics) {
    if (typeof metrics !== 'object' || metrics === null)
        return null;
    const entries = Object.entries(metrics);
    if (entries.length === 0)
        return null;
    const out = {};
    let changed = false;
    for (const [key, value] of entries) {
        const esKey = await toSpanish(key);
        if (esKey) {
            out[esKey] = value;
            changed = true;
        }
        else {
            out[key] = value;
        }
    }
    return changed ? out : null;
}
/** Builds the `*Es` update payload for a freshly created document. */
async function buildEsPayload(data, fields, withMetrics = false) {
    const payload = {};
    for (const field of fields) {
        const es = await toSpanish(data[field]);
        if (es)
            payload[`${field}Es`] = es;
    }
    if (withMetrics) {
        const metricsEs = await metricsToSpanish(data['metrics']);
        if (metricsEs)
            payload['metricsEs'] = metricsEs;
    }
    return Object.keys(payload).length > 0 ? payload : null;
}
async function applyEsPayload(ref, payload) {
    if (!payload)
        return;
    try {
        await ref.update(payload);
        console.log(`[translateContent] ${ref.path} → translated: ${Object.keys(payload).join(', ')}`);
    }
    catch (err) {
        console.error(`[translateContent] failed to write ${ref.path}:`, err);
    }
}
exports.translateDonation = (0, firestore_1.onDocumentCreated)('donations/{id}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const payload = await buildEsPayload(snap.data(), ['note']);
    await applyEsPayload(snap.ref, payload);
});
exports.translateTransfer = (0, firestore_1.onDocumentCreated)('transfers/{id}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const payload = await buildEsPayload(snap.data(), [
        'recipient',
        'purpose',
    ]);
    await applyEsPayload(snap.ref, payload);
});
exports.translateUpdate = (0, firestore_1.onDocumentCreated)('updates/{id}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const payload = await buildEsPayload(snap.data(), ['title', 'body'], true);
    await applyEsPayload(snap.ref, payload);
});
exports.translateMedia = (0, firestore_1.onDocumentCreated)('media/{id}', async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const payload = await buildEsPayload(snap.data(), ['caption']);
    await applyEsPayload(snap.ref, payload);
});
//# sourceMappingURL=translateContent.js.map