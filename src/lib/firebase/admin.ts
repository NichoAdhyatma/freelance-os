/**
 * Firebase Admin SDK — server-side initialization.
 *
 * Used exclusively in Next.js API routes.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.join(process.cwd(), 'service-account.json');

// Initialize only once
let initialized = false;
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

function init() {
  if (initialized) return;

  try {
    // Check existing apps first
    const existingApps = getApps();
    if (existingApps.length > 0) {
      console.log('[Firebase Admin] Using existing app');
      db = getFirestore();
      auth = getAuth();
      initialized = true;
      return;
    }

    // Load service account
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      initializeApp({
        credential: cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
      });
      console.log('[Firebase Admin] Initialized with service account:', serviceAccount.project_id);
    } else {
      initializeApp();
      console.log('[Firebase Admin] Initialized with ADC');
    }

    db = getFirestore();
    auth = getAuth();
    initialized = true;
  } catch (err) {
    console.error('[Firebase Admin] Init error:', err);
    throw err;
  }
}

// Ensure init before each call
init();

export function getAdminDb() {
  if (!db) {
    throw new Error('Firebase Admin DB not initialized');
  }
  return db;
}

export function getAdminAuth() {
  if (!auth) {
    throw new Error('Firebase Admin Auth not initialized');
  }
  return auth;
}
