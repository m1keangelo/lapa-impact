/**
 * Firebase initialization — guarded so the app builds and renders even when
 * env vars are missing or placeholders (preview deploys without credentials).
 * When `firebaseReady` is false, hooks fall back to demo data and pages show
 * their designed empty/demo states.
 *
 * Required env vars (Vite):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

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

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let firebaseAuth: Auth | null = null;

export const firebaseReady: boolean = (() => {
  if (!looksConfigured()) return false;
  try {
    app = initializeApp(firebaseConfig as Record<string, string>);
    firestore = getFirestore(app);
    firebaseAuth = getAuth(app);
    return true;
  } catch (err) {
    console.warn('[firebase] initialization failed, running in demo mode:', err);
    app = null;
    firestore = null;
    firebaseAuth = null;
    return false;
  }
})();

/** Firestore instance, or null when not configured (demo mode). */
export const db = firestore;
/** Firebase Auth instance (admin panel), or null when not configured. */
export const auth = firebaseAuth;
