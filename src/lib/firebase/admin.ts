/**
 * Firebase Admin SDK — server-side initialization.
 *
 * Used exclusively in Next.js API routes.
 * Handles security-sensitive operations:
 *   - License activation
 *   - License creation
 *   - Token verification
 *   - Any write operations that must never be exposed to the browser
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

let initialized = false;

function initAdmin(): void {
  if (initialized || getApps().length > 0) return;
  initialized = true;

  const credPath = path.join(process.cwd(), 'service-account.json');

  if (fs.existsSync(credPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
      initializeApp({ credential: cert(serviceAccount) });
      return;
    } catch {
      // Fall through to ADC
    }
  }

  // Application Default Credentials (works in GCP environments)
  initializeApp();
}

let _db: ReturnType<typeof getFirestore> | null = null;
let _auth: ReturnType<typeof getAuth> | null = null;

export function getAdminDb() {
  initAdmin();
  if (!_db) _db = getFirestore();
  return _db;
}

export function getAdminAuth() {
  initAdmin();
  if (!_auth) _auth = getAuth();
  return _auth;
}
