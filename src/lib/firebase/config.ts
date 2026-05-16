/**
 * Firebase configuration — client-side JS SDK.
 *
 * Used for:
 *   - Authentication (login, logout, token management)
 *   - Reading/writing user's own private data with offline support
 *   - Storage operations (avatars, files)
 *
 * NOT used for: security-sensitive operations (use Admin SDK via API routes instead)
 */
import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  type Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { type FirebaseStorage, getStorage } from 'firebase/storage';

// ─── Config ───────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ─── State ────────────────────────────────────────────────────────────────────

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// ─── Guards ───────────────────────────────────────────────────────────────────

export const isConfigured = (): boolean => {
  return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);
};

// ─── Initialization ────────────────────────────────────────────────────────────

function initFirebase(): void {
  if (!isConfigured() || app) return;

  app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

  // Auth — always initialized (needed for auth state)
  auth = getAuth(app);

  // Storage — always initialized
  storage = getStorage(app);

  // Firestore — with offline persistence and multi-tab support
  // Note: only initialized once; subsequent calls return the same instance
  if (!db) {
    const cache = persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    });
    db = initializeFirestore(app, { localCache: cache });
  }
}

// ─── Exported Getters ─────────────────────────────────────────────────────────

export function getFirebaseAuth(): Auth | null {
  if (!isConfigured()) return null;
  if (!auth) initFirebase();
  return auth;
}

export function getDb(): Firestore | null {
  if (!isConfigured()) return null;
  if (!db) initFirebase();
  return db;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!isConfigured()) return null;
  if (!storage) initFirebase();
  return storage;
}
