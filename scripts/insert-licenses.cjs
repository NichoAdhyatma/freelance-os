/**
 * License key seeder — uses Firebase Admin SDK (service account)
 * Bypasses all API key restrictions and Firestore rules
 *
 * Run: node scripts/insert-licenses.js
 * (Service account loaded from project root, env vars not needed)
 */
const admin = require('firebase-admin');
const path = require('path');

// Load service account from project root
const serviceAccount = require('../service-account.json');

// Initialize Firebase Admin (once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const licenses = [
  { key: 'FOS-PRO-ECLV-3N2G', type: 'pro' },
  { key: 'FOS-PRO-RO53-YMS4', type: 'pro' },
  { key: 'FOS-PRO-BB94-E8VB', type: 'pro' },
  { key: 'FOS-PRO-UMS4-LZQ8', type: 'pro' },
  { key: 'FOS-PRO-6LRR-P13Z', type: 'pro' },
];

async function insertLicenses() {
  console.log('🔧 Initializing Firebase Admin SDK...');
  console.log('✅ Admin SDK initialized\n');

  for (const { key, type } of licenses) {
    const normalizedKey = key.toUpperCase();
    // Clean doc ID: alphanumeric only, max 20 chars, lowercase
    const docId = normalizedKey
      .replace(/[^A-Z0-9]/gi, '')
      .slice(0, 20)
      .toLowerCase();

    const data = {
      key: normalizedKey,
      type,
      status: 'available',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    try {
      await db.collection('licenses').doc(docId).set(data);
      console.log(`  ✅ ${key} → doc: ${docId} (${type})`);
    } catch (err) {
      console.log(`  ❌ ${key}: ${err.message}`);
    }
  }

  console.log('\n🎉 Done!');
}

insertLicenses().catch(console.error);
