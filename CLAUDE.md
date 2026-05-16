# Freelancer OS

Freelancer OS adalah SaaS modern untuk freelancer, creator, dan agency kecil.

Platform ini membantu user mengelola:

- project
- client
- invoice
- revenue
- workflow
- productivity

dalam satu workspace modern berbasis web.

Freelancer OS dijual melalui Lynk.id sebagai:

- digital product
- license-based SaaS
- premium productivity system

---

# Product Vision

Membantu freelancer menjalankan bisnis seperti studio modern menggunakan sistem kerja yang terorganisir, otomatis, dan scalable.

Freelancer OS bukan sekadar project management tool.

Freelancer OS adalah:

- business operating system
- freelancer workspace
- client & revenue management platform
- productivity ecosystem

---

# Product Positioning

Bukan:

- generic project management app
- spreadsheet template
- task tracker biasa

Tetapi:

- Freelancer Operating System
- Modern Workspace for Freelancers
- Business OS for Creative Professionals

---

# Target Audience

## Primary

- Freelancer developer
- UI/UX designer
- Video editor
- Content creator
- Social media specialist
- Creative agency kecil
- Remote worker

## Secondary

- Startup kecil
- Creator team
- Digital agency
- Online business operator

---

# Tech Stack

## Frontend

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui

## UI Components

Seluruh UI harus menggunakan:

- shadcn/ui components
- Radix UI primitives
- Tailwind utilities

Gunakan:

- Card
- Dialog
- Sheet
- Dropdown Menu
- Popover
- Tabs
- Data Table
- Toast
- Skeleton
- Command
- Tooltip

UI harus terasa:

- modern
- minimal
- premium
- responsive
- dashboard-oriented

---

# UI Design System

## Style Direction

Inspirasi visual:

- Linear
- Notion
- Vercel
- Raycast
- Cron

## Theme

- dark mode first
- clean spacing
- smooth radius
- muted colors
- premium typography

## UX Rules

- low clutter
- fast interactions
- keyboard friendly
- responsive layout
- clear hierarchy

## Component Philosophy

Semua component harus:

- reusable
- modular
- composable
- scalable

---

# Backend

## Firebase Configuration

- **JS SDK:** `firebase@12.13.0` (client-side)
- **Admin SDK:** `firebase-admin@13.9.0` (server-side)
- **Project ID:** `freelancer-os-e837b`
- **Region:** default (multi-region)

## Services

| Service                | Usage                                                           |
| ---------------------- | --------------------------------------------------------------- |
| **Firestore**          | Primary database — users, projects, clients, invoices, licenses |
| **Firebase Auth**      | User authentication (email/password)                            |
| **Firebase Storage**   | File storage (user avatars, project attachments)                |
| **Firebase Analytics** | Usage tracking                                                  |

## Deployment

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy all Firebase services
firebase deploy
```

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=freelancer-os-e837b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=freelancer-os-e837b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=freelancer-os-e837b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

# License Key Authentication System

Freelancer OS menggunakan sistem aktivasi berbasis license key.

Produk tetap dijual melalui Lynk.id.

User tidak membeli source code.

User membeli:

- akses platform
- aktivasi akun
- premium features

---

# License Activation Flow

Lynk.id Purchase
↓
User receives license key
↓
User registers account
↓
Input license key
↓
System validates license
↓
Account activated
↓
Premium features unlocked

---

# License Key Format

Example:
FOS-PRO-AB12-CD34

License harus:

- unique
- non-guessable
- generated securely

---

# License Validation Rules

## One License Per Account

1 license hanya untuk:

- 1 account
- 1 primary owner

## Email Binding

License terikat ke:

- email account
- Firebase UID

## Device Monitoring

Optional:

- detect suspicious sessions
- limit abuse

## Remote Revocation

Admin dapat:

- revoke license
- suspend account
- disable abuse

---

# Firestore Collections

> **SDK Version:** Firebase JS SDK v12.x (`firebase@12.13.0`, `firebase-admin@13.9.0`)
> **Rules Version:** Firestore Security Rules v2
> **Persistence:** `persistentLocalCache` with `persistentMultipleTabManager` (multi-tab support)
> **Offline:** Supported via IndexedDB cache

---

## Firestore Indexes

Queries using `where()` on single fields require a single-field index (auto-created by Firestore).
Composite indexes must be created manually via Firebase Console or CLI:

```bash
# Via Firebase CLI
firebase firestore:indexes
```

### Required Composite Indexes

| Collection | Fields                  | Type                |
| ---------- | ----------------------- | ------------------- |
| `licenses` | `key` ASC, `status` ASC | Composite           |
| `users`    | `email` ASC             | Single-field (auto) |

---

## users

`users/{uid}`

Fields:

| Field           | Type              | Description                                                |
| --------------- | ----------------- | ---------------------------------------------------------- |
| `name`          | string            | User display name                                          |
| `email`         | string            | User email (unique per project)                            |
| `avatar`        | string (optional) | Avatar URL                                                 |
| `plan`          | string            | `"free"` \| `"pro"` \| `"agency"`                          |
| `licenseKey`    | string (optional) | Activated license key (e.g. `FOS-PRO-DEMO-TEST`)           |
| `licenseStatus` | string            | `"inactive"` \| `"active"` \| `"suspended"` \| `"expired"` |
| `createdAt`     | Timestamp         | Account creation time                                      |
| `updatedAt`     | Timestamp         | Last profile update                                        |

---

## licenses

`licenses/{licenseId}`

Fields:

| Field         | Type                 | Description                                                  |
| ------------- | -------------------- | ------------------------------------------------------------ |
| `key`         | string               | Normalized license key, e.g. `FOS-PRO-DEMO-TEST`             |
| `type`        | string               | `"free"` \| `"pro"` \| `"agency"`                            |
| `status`      | string               | `"available"` \| `"activated"` \| `"revoked"` \| `"expired"` |
| `activatedBy` | string (optional)    | UID of activating user                                       |
| `activatedAt` | Timestamp (optional) | Activation timestamp                                         |
| `expiresAt`   | Timestamp (optional) | Expiration timestamp                                         |
| `createdAt`   | Timestamp            | License creation time                                        |

**Document ID:** Uses lowercase hash of the key (e.g. `fosprodemotest`)

---

## projects

`users/{uid}/projects/{projectId}`

Fields:

| Field       | Type                 | Description                                                                     |
| ----------- | -------------------- | ------------------------------------------------------------------------------- |
| `title`     | string               | Project name                                                                    |
| `clientId`  | string (optional)    | Reference to client document ID                                                 |
| `status`    | string               | `"planning"` \| `"in_progress"` \| `"review"` \| `"completed"` \| `"cancelled"` |
| `progress`  | number               | 0–100 percentage                                                                |
| `deadline`  | Timestamp (optional) | Project deadline                                                                |
| `priority`  | string               | `"low"` \| `"medium"` \| `"high"` \| `"urgent"`                                 |
| `tags`      | string[]             | Tags for filtering                                                              |
| `createdAt` | Timestamp            | Creation time                                                                   |
| `updatedAt` | Timestamp            | Last update                                                                     |

---

## clients

`users/{uid}/clients/{clientId}`

Fields:

| Field          | Type              | Description                                                 |
| -------------- | ----------------- | ----------------------------------------------------------- |
| `name`         | string            | Client name                                                 |
| `email`        | string            | Client email                                                |
| `whatsapp`     | string (optional) | WhatsApp number                                             |
| `company`      | string (optional) | Company name                                                |
| `notes`        | string (optional) | Internal notes                                              |
| `totalRevenue` | number            | Sum of all paid invoices (updated on invoice status change) |
| `createdAt`    | Timestamp         | Creation time                                               |
| `updatedAt`    | Timestamp         | Last update                                                 |

---

## invoices

`users/{uid}/invoices/{invoiceId}`

Fields:

| Field           | Type                 | Description                                                                      |
| --------------- | -------------------- | -------------------------------------------------------------------------------- |
| `invoiceNumber` | string               | Auto-generated invoice number (e.g. `INV-2024-001`)                              |
| `clientId`      | string               | Client document ID                                                               |
| `title`         | string               | Invoice title/description                                                        |
| `amount`        | number               | Total amount in IDR                                                              |
| `amountPaid`    | number               | Amount already paid (for DP tracking)                                            |
| `status`        | string               | `"draft"` \| `"sent"` \| `"paid"` \| `"partial"` \| `"overdue"` \| `"cancelled"` |
| `dueDate`       | Timestamp            | Payment due date                                                                 |
| `paidAt`        | Timestamp (optional) | When payment was received                                                        |
| `items`         | object[]             | Line items: `[{ description, quantity, unitPrice, amount }]`                     |
| `notes`         | string (optional)    | Additional notes                                                                 |
| `createdAt`     | Timestamp            | Creation time                                                                    |
| `updatedAt`     | Timestamp            | Last update                                                                      |

---

## Firestore Security Rules

```rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── Helpers ──────────────────────────────────────────────
    function isAuthenticated() { return request.auth != null; }
    function isOwner(userId) { return request.auth.uid == userId; }
    function isUserSubcollection(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    // ── users ────────────────────────────────────────────────
    // Only the owning user can read/write their own document.
    // Anyone can read (needed for license activation lookup).
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isOwner(userId);
      allow delete: if false; // Never delete user documents
    }

    // ── licenses ────────────────────────────────────────────
    // Public read (license keys are public on activation page).
    // Writes admin-only via Firebase Admin SDK (server-side).
    match /licenses/{licenseId} {
      allow read: if true;
      allow write: if false;
    }

    // ── User subcollections ───────────────────────────────────
    match /users/{userId}/projects/{projectId} {
      allow read, write: if isUserSubcollection(userId);
    }
    match /users/{userId}/clients/{clientId} {
      allow read, write: if isUserSubcollection(userId);
    }
    match /users/{userId}/invoices/{invoiceId} {
      allow read, write: if isUserSubcollection(userId);
    }
  }
}
```

### Rules Deployment

```bash
firebase deploy --only firestore:rules
```

---

## Offline Persistence

`src/lib/firebase/config.ts` uses `persistentLocalCache` with multi-tab support:

```typescript
import { persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const cache = persistentLocalCache({
  tabManager: persistentMultipleTabManager(),
});
db = initializeFirestore(app, { localCache: cache });
```

- **Multi-tab:** `persistentMultipleTabManager()` allows multiple tabs to share the same cache
- **Offline writes:** Writes are queued and synced when online
- **Cache priority:** App tries cache first (`getDocs`), falls back to server (`getDocsFromServer`) if cache is empty

---

# Anti Piracy Strategy

Karena berbasis SaaS:

- tidak ada spreadsheet mentah
- tidak ada downloadable source
- semua data cloud-based
- semua akses server-controlled

## Protection Layers

- Firebase authentication
- License activation
- Email binding
- Remote revocation
- Access control
- Feature gating

---

# Core Features

## Dashboard

- Revenue overview
- Active projects
- Pending invoice
- Deadline alerts
- Productivity insights

## Project Management

- Kanban board
- Timeline
- Status tracking
- Progress monitoring
- Priority system

## Client CRM

- Client database
- Contact management
- Notes & activity history
- Revenue per client

## Finance

- Invoice management
- DP tracking
- Payment monitoring
- Revenue analytics

## Productivity

- Daily overview
- Workload monitoring
- Smart reminders

---

# Folder Structure

src/
├── app/
├── components/
│ ├── ui/
│ ├── dashboard/
│ ├── projects/
│ ├── clients/
│ ├── finance/
│ └── shared/
├── features/
│ ├── auth/
│ ├── license/
│ ├── dashboard/
│ ├── projects/
│ ├── clients/
│ └── finance/
├── lib/
│ ├── firebase/
│ ├── services/
│ ├── validations/
│ └── utils/
├── hooks/
├── store/
├── types/
└── styles/

---

# Development Philosophy

Freelancer OS harus:

- simple
- scalable
- maintainable
- modular
- production-ready

Prioritize:

- clean architecture
- developer experience
- fast performance
- excellent UX

---

# Subscription Plans

## Free

- limited projects
- basic dashboard

## Pro

- unlimited projects
- analytics
- invoice management
- advanced dashboard

## Agency

- collaboration
- team workspace
- advanced workflow

---

# Future AI Features

- Proposal generator
- Brief summarizer
- AI reminders
- Smart productivity assistant
- Revenue insights
- Task recommendation

---

# Non Goals

Freelancer OS bukan:

- enterprise ERP
- bloated PM software
- complicated accounting app

Freelancer OS fokus pada:

- freelancer workflow
- simplicity
- productivity
- operational clarity

---

# Founder Mindset

Freelancer OS dibangun untuk membantu freelancer:

- bekerja lebih profesional
- lebih terorganisir
- meningkatkan produktivitas
- mengelola bisnis dengan serius

# Firebase SDK Architecture

## Rule: SDK vs REST API

| Scenario                                                 | Approach                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------- |
| Authentication (login, logout, token)                    | **Firebase JS SDK** — `getAuth()`                               |
| Read/write user's own data (projects, clients, invoices) | **Firebase JS SDK** with offline cache (`persistentLocalCache`) |
| Storage (avatars, files)                                 | **Firebase JS SDK** — `getStorage()`                            |
| License activation / validation                          | **API Route + Admin SDK** ✅                                    |
| Admin operations (create, revoke licenses)               | **API Route + Admin SDK** ✅                                    |
| Token verification (server-side)                         | **Admin SDK** ✅                                                |

**Why:** Browser network restrictions can block direct Firestore SDK calls (`getDocsFromServer` fails with `unavailable`). Server-side Admin SDK via Next.js API routes always works.

## Files

| File                                     | Purpose                                                     |
| ---------------------------------------- | ----------------------------------------------------------- |
| `src/lib/firebase/config.ts`             | Client-side JS SDK init (Auth, Firestore, Storage)          |
| `src/lib/firebase/admin.ts`              | Server-side Admin SDK init (API routes only)                |
| `src/lib/firebase/constants.ts`          | Shared constants (`LICENSE_KEY_REGEX`, `PLAN_FROM_LICENSE`) |
| `src/app/api/licenses/activate/route.ts` | POST — License activation (requires Firebase ID token)      |
| `src/app/api/licenses/validate/route.ts` | POST — License validation (public)                          |
| `src/app/api/licenses/route.ts`          | POST — Admin: create licenses (requires `x-admin-secret`)   |

## Environment

- **Client-side**: `NEXT_PUBLIC_FIREBASE_*` vars in `.env.local`
- **Server-side (Admin)**: `service-account.json` at project root (gitignored)

## Session History

See `src/docs/sessions/` for detailed session logs.
