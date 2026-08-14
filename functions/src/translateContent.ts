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
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';
import type { DocumentReference } from 'firebase-admin/firestore';
import { Translate } from '@google-cloud/translate/build/src/v2';

if (getApps().length === 0) initializeApp();

const translate = new Translate();

const TARGET = 'es';

/** Translates one string to Spanish. Returns null when already Spanish. */
async function toSpanish(text: unknown): Promise<string | null> {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (trimmed.length < 3) return null; // names, initials, numbers — leave alone

  try {
    const [detection] = await translate.detect(trimmed);
    const detected =
      typeof detection === 'object' && detection !== null && 'language' in detection
        ? (detection as { language?: string }).language
        : undefined;
    if (detected?.toLowerCase().startsWith(TARGET)) return null; // already Spanish

    const [translated] = await translate.translate(trimmed, {
      from: detected,
      to: TARGET,
    });
    const out = typeof translated === 'string' ? translated.trim() : '';
    return out.length > 0 && out !== trimmed ? out : null;
  } catch (err) {
    // Never block a write because translation failed — log and move on.
    console.error('[translateContent] translation failed:', err);
    return null;
  }
}

/** Translates the values of a metrics object (keys are display labels). */
async function metricsToSpanish(
  metrics: unknown,
): Promise<Record<string, number | string> | null> {
  if (typeof metrics !== 'object' || metrics === null) return null;
  const entries = Object.entries(metrics as Record<string, number | string>);
  if (entries.length === 0) return null;

  const out: Record<string, number | string> = {};
  let changed = false;
  for (const [key, value] of entries) {
    const esKey = await toSpanish(key);
    if (esKey) {
      out[esKey] = value;
      changed = true;
    } else {
      out[key] = value;
    }
  }
  return changed ? out : null;
}

/** Builds the `*Es` update payload for a freshly created document. */
async function buildEsPayload(
  data: Record<string, unknown>,
  fields: string[],
  withMetrics = false,
): Promise<Record<string, unknown> | null> {
  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    const es = await toSpanish(data[field]);
    if (es) payload[`${field}Es`] = es;
  }
  if (withMetrics) {
    const metricsEs = await metricsToSpanish(data['metrics']);
    if (metricsEs) payload['metricsEs'] = metricsEs;
  }
  return Object.keys(payload).length > 0 ? payload : null;
}

async function applyEsPayload(
  ref: DocumentReference,
  payload: Record<string, unknown> | null,
): Promise<void> {
  if (!payload) return;
  try {
    await ref.update(payload);
    console.log(`[translateContent] ${ref.path} → translated: ${Object.keys(payload).join(', ')}`);
  } catch (err) {
    console.error(`[translateContent] failed to write ${ref.path}:`, err);
  }
}

export const translateDonation = onDocumentCreated('donations/{id}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const payload = await buildEsPayload(snap.data() as Record<string, unknown>, ['note']);
  await applyEsPayload(snap.ref, payload);
});

export const translateTransfer = onDocumentCreated('transfers/{id}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const payload = await buildEsPayload(snap.data() as Record<string, unknown>, [
    'recipient',
    'purpose',
  ]);
  await applyEsPayload(snap.ref, payload);
});

export const translateUpdate = onDocumentCreated('updates/{id}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const payload = await buildEsPayload(
    snap.data() as Record<string, unknown>,
    ['title', 'body'],
    true,
  );
  await applyEsPayload(snap.ref, payload);
});

export const translateMedia = onDocumentCreated('media/{id}', async (event) => {
  const snap = event.data;
  if (!snap) return;
  const payload = await buildEsPayload(snap.data() as Record<string, unknown>, ['caption']);
  await applyEsPayload(snap.ref, payload);
});
