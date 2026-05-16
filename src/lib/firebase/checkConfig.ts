/**
 * Firebase Configuration Helper
 * Cek apakah Firebase sudah di-setup dengan benar
 */

import { isConfigured } from '@/lib/firebase/config';

export interface FirebaseConfigStatus {
  configured: boolean;
  apiKey: boolean;
  authDomain: boolean;
  projectId: boolean;
  storageBucket: boolean;
  messagingSenderId: boolean;
  appId: boolean;
  missingVars: string[];
}

export function checkFirebaseConfig(): FirebaseConfigStatus {
  const status: FirebaseConfigStatus = {
    configured: isConfigured(),
    apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    missingVars: [],
  };

  if (!status.apiKey) status.missingVars.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  if (!status.authDomain) status.missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!status.projectId) status.missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  if (!status.storageBucket) status.missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!status.messagingSenderId)
    status.missingVars.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!status.appId) status.missingVars.push('NEXT_PUBLIC_FIREBASE_APP_ID');

  return status;
}

export function getEnvExample(): Record<string, string> {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSy...',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'your-project.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'your-project-id',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'your-project.appspot.com',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789012',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789012:web:abc123',
  };
}

// Usage example:
// import { checkFirebaseConfig } from "@/lib/firebase/checkConfig";

// if (typeof window !== "undefined") {
//   const status = checkFirebaseConfig();
//   if (!status.configured) {
//     console.warn("Firebase not configured! Missing:", status.missingVars);
//   }
// }
