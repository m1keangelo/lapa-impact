"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkMyDonations = void 0;
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
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
function db() {
    if ((0, app_1.getApps)().length === 0)
        (0, app_1.initializeApp)();
    return (0, firestore_1.getFirestore)();
}
exports.linkMyDonations = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Sign in to link your gifts.');
    }
    const email = request.auth.token.email?.trim();
    if (!email) {
        throw new https_1.HttpsError('failed-precondition', 'Your account has no email to match gifts against.');
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
        const data = docSnap.data();
        if (!data.donationId || data.donorUid === uid)
            continue;
        batch.update(firestore.collection('donations').doc(data.donationId), {
            donorUid: uid,
        });
        batch.update(docSnap.ref, { donorUid: uid });
        linked += 1;
    }
    for (const docSnap of giftEmails.docs) {
        const data = docSnap.data();
        if (data.donorUid === uid)
            continue;
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
        .set({
        email,
        lastLinkedAt: firestore_1.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`[linkMyDonations] ${email} → linked ${linked} gift(s) to ${uid}`);
    return { linked };
});
//# sourceMappingURL=linkMyDonations.js.map