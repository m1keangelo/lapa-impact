/**
 * lookupDonation — public endpoint polled by /donate/success. Given a Stripe
 * checkout session id, returns the confirmation status and the generated
 * donor code once the webhook has written it.
 *
 *   GET /lookupDonation?session_id=cs_test_…
 *   → 200 { status: 'confirmed', code: 'X7kQ2mPv9Rt4' }
 *   → 200 { status: 'pending' }            (webhook hasn't landed yet)
 *   → 400 { error: 'missing session_id' }
 *
 * Never returns email, name, amount, or any other PII — only the code,
 * which the donor just proved ownership of by completing checkout.
 * Reads via the Admin SDK, so the `stripeSessions` collection stays fully
 * closed in Firestore security rules.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function db() {
  if (getApps().length === 0) initializeApp();
  return getFirestore();
}

export const lookupDonation = onRequest(
  { cors: true },
  async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }

    const sessionId = req.query.session_id;
    if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      res.status(400).json({ error: 'missing session_id' });
      return;
    }

    try {
      const snap = await db()
        .collection('stripeSessions')
        .doc(sessionId.trim())
        .get();
      if (!snap.exists) {
        res.status(200).json({ status: 'pending' });
        return;
      }
      const data = snap.data() ?? {};
      if (data.status === 'confirmed' && typeof data.code === 'string') {
        res.status(200).json({ status: 'confirmed', code: data.code });
        return;
      }
      res.status(200).json({ status: 'pending' });
    } catch (err) {
      console.error('[lookupDonation] lookup failed:', err);
      res.status(500).json({ status: 'pending' });
    }
  },
);
