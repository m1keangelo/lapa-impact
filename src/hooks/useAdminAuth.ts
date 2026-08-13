/**
 * Admin auth gate — Firebase Auth email/password for the /admin panel.
 * Subscribes via onAuthStateChanged so the session persists across reloads.
 * When Firebase is not configured (firebaseReady === false) the hook stays
 * signed-out and the page shows the configuration notice instead.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseReady } from '@/lib/firebase';

export interface AdminAuth {
  user: User | null;
  /** true while the first onAuthStateChanged callback is pending */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAdminAuth(): AdminAuth {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(firebaseReady);

  useEffect(() => {
    if (!firebaseReady || !auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth is not configured.');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOut = useCallback(async () => {
    if (auth) await firebaseSignOut(auth);
  }, []);

  return { user, loading, signIn, signOut };
}
