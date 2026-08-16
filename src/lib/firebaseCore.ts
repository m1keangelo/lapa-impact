/**
 * Firebase CORE — the config check plus a lazily-initialized SDK handle.
 *
 * The public pages (home, feed, gallery) import this module so the Firebase
 * SDK stays OUT of the entry bundle: `firebaseReady` is a pure env check,
 * and the SDK itself is loaded on demand via dynamic `import()` the first
 * time a live subscription is actually opened (getDb/getAuth).
 *
 * Admin/auth flows may keep using '@/lib/firebase' (static SDK) — those
 * routes are code-split and only load for staff/donors who need them.
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

function looksConfigured(): boolean {
  const { apiKey, projectId, appId } = firebaseConfig;
  if (!apiKey || !projectId || !appId) return false;
  // Reject obvious placeholders
  const joined = `${apiKey}${projectId}${appId}`.toLowerCase();
  return !/(placeholder|your-|xxx|todo|changeme)/.test(joined);
}

/** True when real credentials exist — pure check, no SDK side effects. */
export const firebaseReady: boolean = looksConfigured();

type FirestoreType = import('firebase/firestore').Firestore;
type AuthType = import('firebase/auth').Auth;

let dbPromise: Promise<FirestoreType | null> | null = null;
let authPromise: Promise<AuthType | null> | null = null;

/** Lazily load the SDK and return Firestore (null when not configured). */
export function getDb(): Promise<FirestoreType | null> {
  if (!firebaseReady) return Promise.resolve(null);
  dbPromise ??= (async () => {
    try {
      const [{ initializeApp }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore'),
      ]);
      return getFirestore(initializeApp(firebaseConfig as Record<string, string>));
    } catch (err) {
      console.warn('[firebase] lazy init failed, running in demo mode:', err);
      return null;
    }
  })();
  return dbPromise;
}

/** Lazily load the SDK and return Auth (null when not configured). */
export function getAuthLazy(): Promise<AuthType | null> {
  if (!firebaseReady) return Promise.resolve(null);
  authPromise ??= (async () => {
    try {
      const [{ getApp }, { getAuth }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
      ]);
      await getDb(); // ensure the app exists first
      return getAuth(getApp());
    } catch (err) {
      console.warn('[firebase] lazy auth init failed:', err);
      return null;
    }
  })();
  return authPromise;
}
