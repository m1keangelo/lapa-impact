/**
 * Donor auth — email + password accounts via Firebase Auth (master §35–37).
 * Replaces the 6-digit donor code for the public experience: a donor gives,
 * creates an account with the same email, and their gifts are linked to
 * their uid (stamped on donations as `donorUid` by the backend).
 *
 * accounts/{uid} holds the donor's first name (owner-read/write only).
 * This module never touches the old donors/{code} collection.
 */
import { useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db, firebaseReady } from './firebase';

export interface AuthState {
  user: User | null;
  loading: boolean;
}

/** Live Firebase Auth state for the current visitor. */
export function useAuthUser(): AuthState {
  const [state, setState] = useState<AuthState>(() => ({
    user: auth?.currentUser ?? null,
    loading: firebaseReady,
  }));

  useEffect(() => {
    if (!auth) {
      setState({ user: null, loading: false });
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) =>
      setState({ user, loading: false }),
    );
    return unsub;
  }, []);

  return state;
}

export class AuthUnavailableError extends Error {
  constructor() {
    super('auth-unavailable');
  }
}

/** Sign in an existing donor account. */
export async function signInDonor(email: string, password: string): Promise<User> {
  if (!auth) throw new AuthUnavailableError();
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}

/**
 * Create a donor account: Auth user + display name + accounts/{uid} profile.
 * The account email should match the email used at checkout so the backend
 * can link past and future gifts.
 */
export async function signUpDonor(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  if (!auth || !db) throw new AuthUnavailableError();
  const firstName = name.trim().split(/\s+/)[0] ?? name.trim();
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await updateProfile(cred.user, { displayName: firstName });
  } catch (err) {
    console.warn('[auth] updateProfile failed (non-fatal):', err);
  }
  try {
    await setDoc(doc(db, 'accounts', cred.user.uid), {
      name: firstName,
      email: email.trim(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[auth] accounts profile write failed (non-fatal):', err);
  }
  return cred.user;
}

export async function resetDonorPassword(email: string): Promise<void> {
  if (!auth) throw new AuthUnavailableError();
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOutDonor(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Silently link any donations made with this account's email to its uid.
 * Idempotent and safe to call on every My Impact mount; degrades quietly
 * while the Cloud Functions backend isn't deployed yet.
 */
export async function linkMyDonations(): Promise<void> {
  if (!firebaseReady || !auth?.currentUser) return;
  try {
    const fn = httpsCallable(getFunctions(), 'linkMyDonations');
    await fn();
  } catch (err) {
    // functions-not-deployed / offline — gifts link on the next sign-in.
    console.info('[auth] linkMyDonations unavailable for now:', err);
  }
}

/** Resolve a friendly first name: accounts profile → display name → email prefix. */
export function useAccountName(user: User | null): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(null);
    if (!user || !db) return;
    let cancelled = false;
    getDoc(doc(db, 'accounts', user.uid))
      .then((snap) => {
        if (cancelled) return;
        const n = (snap.data()?.name as string | undefined)?.trim();
        setName(n || user.displayName || user.email?.split('@')[0] || null);
      })
      .catch(() => {
        if (cancelled) return;
        setName(user.displayName || user.email?.split('@')[0] || null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return name;
}

/** Map a Firebase Auth error to one of the i18n copy keys. */
export function authErrorKey(err: unknown):
  | 'errWrong'
  | 'errEmailInUse'
  | 'errWeak'
  | 'errInvalidEmail'
  | 'errGeneric' {
  const code = (err as { code?: string } | null)?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'errWrong';
    case 'auth/email-already-in-use':
      return 'errEmailInUse';
    case 'auth/weak-password':
      return 'errWeak';
    case 'auth/invalid-email':
      return 'errInvalidEmail';
    default:
      return 'errGeneric';
  }
}
