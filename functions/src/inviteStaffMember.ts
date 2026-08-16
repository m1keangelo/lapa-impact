/**
 * inviteStaffMember — callable, ADMIN-ONLY.
 *
 * Creates a Firebase Auth account AND binds it to a staff role in one step,
 * so the admin never has to open the Firebase console to add a teammate.
 * Returns a one-time temporary password for the admin to hand to the person.
 *
 * If the email already has an Auth account but no staff doc (an "orphan"
 * account, e.g. created by hand in the console), the function adopts it:
 * it binds the role but leaves that person's existing password untouched.
 *
 * Security: the Admin SDK bypasses Firestore rules, so the caller's role is
 * verified server-side here — only an active admin may invite. Every invite
 * is written to auditLogs.
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { randomBytes } from 'crypto';

const ROLES = new Set(['admin', 'finance', 'field']);

function services() {
  if (getApps().length === 0) initializeApp();
  return { auth: getAuth(), firestore: getFirestore() };
}

/** Human-copyable 16-char password without ambiguous glyphs (0/O, 1/l/I). */
function tempPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(16);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export const inviteStaffMember = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in to invite team members.');
  }
  const { auth, firestore } = services();

  // Server-side authorization — only an ACTIVE admin may invite.
  const callerSnap = await firestore
    .collection('staff')
    .doc(request.auth.uid)
    .get();
  const caller = callerSnap.data() as
    | { role?: string; active?: boolean }
    | undefined;
  if (!caller || caller.active !== true || caller.role !== 'admin') {
    throw new HttpsError(
      'permission-denied',
      'Only an active admin can invite team members.',
    );
  }

  const data = request.data as {
    email?: unknown;
    name?: unknown;
    role?: unknown;
  };
  const email =
    typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const role = typeof data.role === 'string' ? data.role : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw new HttpsError('invalid-argument', 'A valid email is required.');
  }
  if (name.length < 1 || name.length > 60) {
    throw new HttpsError('invalid-argument', 'Name is required (max 60 chars).');
  }
  if (!ROLES.has(role)) {
    throw new HttpsError(
      'invalid-argument',
      'Role must be admin, finance, or field.',
    );
  }

  const password = tempPassword();
  let uid: string;
  let created = true;
  try {
    const user = await auth.createUser({ email, password, displayName: name });
    uid = user.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === 'auth/email-already-exists') {
      const existing = await auth.getUserByEmail(email);
      const staffSnap = await firestore
        .collection('staff')
        .doc(existing.uid)
        .get();
      if (staffSnap.exists) {
        throw new HttpsError(
          'already-exists',
          'That email already belongs to a team member. Update their role from the list below instead.',
        );
      }
      // Orphan Auth account: adopt it, keep their password as-is.
      uid = existing.uid;
      created = false;
    } else {
      throw new HttpsError('internal', 'Could not create the account.');
    }
  }

  await firestore
    .collection('staff')
    .doc(uid)
    .set(
      {
        name,
        role,
        active: true,
        email,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  await firestore.collection('auditLogs').add({
    actorUid: request.auth.uid,
    actorEmail: (request.auth.token.email as string | undefined) ?? null,
    action: 'staff.invite',
    detail: { targetUid: uid, email, role, createdAuthAccount: created },
    at: FieldValue.serverTimestamp(),
  });

  return {
    uid,
    email,
    role,
    created,
    tempPassword: created ? password : null,
  };
});
