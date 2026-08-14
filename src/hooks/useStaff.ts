/**
 * Staff role hook — the role-based access layer (spec §8–12).
 *
 * staff/{uid} documents decide what a signed-in account sees:
 *   admin   → full control room (all tabs + approval queue + team)
 *   finance → money in/out console with receipts (e.g. Mayra)
 *   field   → volunteer report console (photos + note + submit)
 *
 * A signed-in account with no staff doc yet gets the one-time bootstrap
 * card: Firebase Auth users can only be created from the Firebase console,
 * so anyone who can sign in at all was already invited — the first one
 * claims the admin profile, later accounts are given their role by an
 * admin in the Team tab.
 */
import { useCallback, useEffect, useState } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import type { StaffRole, StaffUser } from '@/lib/types';

export interface StaffState {
  /** null while loading or when no staff doc exists yet. */
  staff: StaffUser | null;
  loading: boolean;
  /** true when signed in but no staff profile exists → show bootstrap. */
  needsBootstrap: boolean;
  /** Create the first admin profile for the signed-in account. */
  bootstrapAdmin: (name: string) => Promise<void>;
}

export function useStaff(user: User | null): StaffState {
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(user));

  useEffect(() => {
    if (!user || !db) {
      setStaff(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = onSnapshot(
      doc(db, 'staff', user.uid),
      (snap) => {
        setStaff(snap.exists() ? (snap.data() as StaffUser) : null);
        setLoading(false);
      },
      (err) => {
        console.warn('[useStaff] listener failed:', err);
        setStaff(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  const bootstrapAdmin = useCallback(
    async (name: string) => {
      if (!user || !db) throw new Error('Not signed in.');
      const profile: StaffUser = {
        name: name.trim() || user.email?.split('@')[0] || 'Admin',
        role: 'admin' satisfies StaffRole,
        active: true,
        email: user.email ?? undefined,
        createdAt: serverTimestamp() as never,
      };
      await setDoc(doc(db, 'staff', user.uid), profile);
    },
    [user],
  );

  return {
    staff,
    loading,
    needsBootstrap: !loading && user != null && staff === null,
    bootstrapAdmin,
  };
}
