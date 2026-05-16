# ============================================

# FREELANCER OS - FIREBASE SETUP GUIDE

# ============================================

## Step 1: Create Firebase Project

1. Buka https://console.firebase.google.com/
2. Klik "Add project" → Nama: "freelancer-os"
3. Matikan Google Analytics (optional) → Create Project
4. Tunggu sampai selesai → Continue

## Step 2: Enable Authentication

1. Di sidebar → Authentication → Get started
2. Tab "Sign-in method"
3. Klik "Email/Password" → Enable → Save
4. (Optional) Enable Google, GitHub, dll

## Step 3: Create Firestore Database

1. Firestore Database → Create database
2. Pilih location terdekat (asia-southeast1 untuk Indonesia)
3. Start in "test mode" (nanti kita update rules)
4. Create → Tunggu selesai

## Step 4: Register Web App

1. Settings (gear icon) → General
2. Scroll ke "Your apps" → Klik icon Web (</>)
3. App nickname: "Freelancer OS Web"
4. Check "Firebase Hosting" (optional)
5. Register app

## Step 5: Copy Config Values

Dari Firebase Console, copy semua nilai ini:

```bash
# Dari web app config
apiKey → NEXT_PUBLIC_FIREBASE_API_KEY
authDomain → NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
projectId → NEXT_PUBLIC_FIREBASE_PROJECT_ID
storageBucket → NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
messagingSenderId → NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
appId → NEXT_PUBLIC_FIREBASE_APP_ID
```

## Step 6: Deploy Firestore Rules

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login:

```bash
firebase login
```

3. Initialize Firebase di project:

```bash
firebase init
# Pilih: Firestore, Hosting (optional)
# File: firestore.rules
# Public: .next/static (optional)
```

4. Deploy rules:

```bash
firebase deploy --only firestore:rules
```

## Step 7: Create License Collection (Optional)

Di Firestore, buat collection "licenses" dengan sample data:

Collection ID: `licenses`
Document ID: auto-generated

```json
{
  "key": "FOS-PRO-XXXX-XXXX",
  "type": "pro",
  "status": "available",
  "createdAt": timestamp
}
```

---

# ENVIRONMENT VARIABLES

# ============================================

# Copy isi ini ke .env.local dan isi nilainya

# Firebase Configuration

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
