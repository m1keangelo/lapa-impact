/**
 * linkMyDonations — callable, auth-required (master §35–37).
 *
 * When a donor creates their account AFTER giving, their past gifts have no
 * `donorUid` yet. This function looks up confirmed stripeSessions by the
 * caller's verified token email (stripeSessions is a rules-closed
 * collection, so this is the safe place holding emails), then stamps
 * `donorUid` onto each linked donation so My Impact can query
 * `where('donorUid','==', uid)`. Idempotent — safe to call on every mount.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

function db() {
  if (getApps().length === 0) initializeApp();
  return getFirestore();
}

export const linkMyDonations = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to link your gifts.');
  }
  const email = (request.auth.token.email as string | undefined)?.trim();
  if (!email) {
    throw new HttpsError(
      'failed-precondition',
      'Your account has no email to match gifts against.',
    );
  }
  const uid = request.auth.uid;
  const firestore = db();

  const normalized = email.toLowerCase();

  const sessions = await firestore
    .collection('stripeSessions')
    .where('email', '==', email)
    .get();

  // giftEmails — the rules-closed sidecar written by the admin Gift form
  // (final doc §58: no six-digit codes; the email connects the gift).
  const giftEmails = await firestore
    .collection('giftEmails')
    .where('email', '==', normalized)
    .get();

  let linked = 0;
  const batch = firestore.batch();
  for (const docSnap of sessions.docs) {
    const data = docSnap.data() as {
      donationId?: string;
      donorUid?: string;
    };
    if (!data.donationId || data.donorUid === uid) continue;
    batch.update(firestore.collection('donations').doc(data.donationId), {
      donorUid: uid,
    });
    batch.update(docSnap.ref, { donorUid: uid });
    linked += 1;
  }
  for (const docSnap of giftEmails.docs) {
    const data = docSnap.data() as { donorUid?: string };
    if (data.donorUid === uid) continue;
    // The giftEmails doc id IS the donation id (written in the same batch).
    batch.update(firestore.collection('donations').doc(docSnap.id), {
      donorUid: uid,
    });
    batch.update(docSnap.ref, { donorUid: uid });
    linked += 1;
  }
  if (linked > 0) {
    // Also roll the donors/{code} total forward? No need — donor totals are
    // email-keyed already; the account just needs the donation docs stamped.
    await batch.commit();
  }

  // Touch the account doc so My Impact has a profile even if the client
  // didn't write one (e.g. account created before this shipped).
  await firestore
    .collection('accounts')
    .doc(uid)
    .set(
      {
        email,
        lastLinkedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  console.log(`[linkMyDonations] ${email} → linked ${linked} gift(s) to ${uid}`);
  return { linked };
});
