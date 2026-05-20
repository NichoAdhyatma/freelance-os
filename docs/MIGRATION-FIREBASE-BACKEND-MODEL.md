# Freelancer OS — Firebase → PostgreSQL Backend Migration Guide

**Date:** 2026-05-20
**Source:** Firebase Firestore + Firebase Auth
**Target:** PostgreSQL (e.g., Supabase, Neon, Vercel Postgres)
**Frontend:** Next.js App Router (unchanged)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Model — PostgreSQL Schema](#2-data-model--postgresql-schema)
3. [Collection → Table Mapping](#3-collection--table-mapping)
4. [Field Type Mapping](#4-field-type-mapping)
5. [API Routes → Server Actions / API](#5-api-routes--server-actions--api)
6. [Authentication Migration](#6-authentication-migration)
7. [License Key System](#7-license-key-system)
8. [Security & Authorization](#8-security--authorization)
9. [Composite Indexes → PostgreSQL Indexes](#9-composite-indexes--postgresql-indexes)
10. [Realtime Subscriptions → SSE / Polling](#10-realtime-subscriptions--sse--polling)
11. [Offline Persistence](#11-offline-persistence)
12. [File Storage](#12-file-storage)
13. [Environment Variables](#13-environment-variables)
14. [Migration Checklist](#14-migration-checklist)

---

## 1. Architecture Overview

### Current Firebase Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│                                                     │
│  Firebase JS SDK          Firebase Auth             │
│  ├── Firestore (offline)   └── JWT tokens           │
│  └── Storage (avatars)                              │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────────┐
│            Next.js API Routes (server)               │
│                                                     │
│  Firebase Admin SDK                                 │
│  ├── Firestore Admin (licenses: write)              │
│  └── Auth (token verification)                      │
└─────────────────────────────────────────────────────┘
```

### Target PostgreSQL Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│                                                     │
│  Next.js Server Components / Server Actions          │
│  └── Direct PostgreSQL queries (via Prisma/Drizzle) │
└──────────────────┬──────────────────────────────────┘
                   │ Postgres protocol (TCP/TLS)
                   ▼
┌─────────────────────────────────────────────────────┐
│                 PostgreSQL Database                  │
│                                                     │
│  Users │ Licenses │ Projects │ Tasks │ Clients │     │
│  Invoices                                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Auth Provider (Clerk / Auth.js / Supabase Auth)    │
└─────────────────────────────────────────────────────┘
```

---

## 2. Data Model — PostgreSQL Schema

### ER Diagram (Conceptual)

```
users ───────────────────────────────────────────────────┐
  │ (has many)                                          │
  │                                                      │
  ├── projects ──────────────────────────────────┐       │
  │    │ (has many)                              │       │
  │    │                                          │       │
  │    └── tasks                                  │       │
  │         (belongs to project)                  │       │
  │                                                      │
  ├── clients ───────────────────────────────────────────┤
  │    │ (has many)                                   │
  │    │                                               │
  │    └── invoices                                   │
  │         (belongs to client + project)               │
  │                                                      │
  └── invoices ◄────────────────────────────────────────┘
       (belongs to client + project)
```

---

## 3. Collection → Table Mapping

### 3.1 `users/{uid}` → `users` table

Firestore path: `users/{uid}`

| Firestore Field | PostgreSQL Column | Type | Notes |
|---|---|---|---|
| `uid` (doc ID) | `id` | `UUID` | Primary key, from auth provider |
| `name` | `name` | `VARCHAR(255)` | |
| `email` | `email` | `VARCHAR(255)` | Unique |
| `avatar` | `avatar` | `TEXT` | Nullable, URL |
| `plan` | `plan` | `VARCHAR(20)` | `enum('free','pro','agency')` |
| `licenseKey` | `license_key` | `VARCHAR(50)` | Nullable |
| `licenseStatus` | `license_status` | `VARCHAR(20)` | `enum('inactive','active','suspended','expired')` |
| `createdAt` (Timestamp) | `created_at` | `TIMESTAMPTZ` | |
| `updatedAt` (Timestamp) | `updated_at` | `TIMESTAMPTZ` | |

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  avatar        TEXT,
  plan          VARCHAR(20) NOT NULL DEFAULT 'free'
                 CHECK (plan IN ('free', 'pro', 'agency')),
  license_key   VARCHAR(50),
  license_status VARCHAR(20) NOT NULL DEFAULT 'inactive'
                 CHECK (license_status IN ('inactive', 'active', 'suspended', 'expired')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
```

### 3.2 `licenses/{licenseId}` → `licenses` table

Firestore path: `licenses/{licenseId}` (doc ID = lowercase hash of key)

| Firestore Field | PostgreSQL Column | Type | Notes |
|---|---|---|---|
| `key` (normalized) | `key` | `VARCHAR(50)` | Unique, normalized `FOS-PRO-AB12...` |
| `type` | `type` | `VARCHAR(20)` | `enum('free','pro','agency')` |
| `status` | `status` | `VARCHAR(20)` | `enum('available','activated','revoked','expired')` |
| `activatedBy` | `activated_by` | `UUID` | FK → users.id, nullable |
| `activatedAt` | `activated_at` | `TIMESTAMPTZ` | Nullable |
| `expiresAt` | `expires_at` | `TIMESTAMPTZ` | Nullable |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | |

```sql
CREATE TABLE licenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           VARCHAR(50) UNIQUE NOT NULL,
  type          VARCHAR(20) NOT NULL DEFAULT 'pro'
                 CHECK (type IN ('free', 'pro', 'agency')),
  status        VARCHAR(20) NOT NULL DEFAULT 'available'
                 CHECK (status IN ('available', 'activated', 'revoked', 'expired')),
  activated_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  activated_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_activated_by ON licenses(activated_by);
```

**Composite index needed:**
```sql
-- Firebase: key ASC + status ASC
CREATE INDEX idx_licenses_key_status ON licenses(key, status);
```

### 3.3 `users/{uid}/projects/{projectId}` → `projects` table

Firestore path: `users/{uid}/projects/{projectId}`

| Firestore Field | PostgreSQL Column | Type | Notes |
|---|---|---|---|
| `id` (doc ID) | `id` | `UUID` | Primary key |
| `title` | `title` | `VARCHAR(255)` | |
| `description` | `description` | `TEXT` | Nullable |
| `clientId` | `client_id` | `UUID` | FK → clients.id, nullable |
| `status` | `status` | `VARCHAR(20)` | `enum('backlog','in_progress','review','done')` |
| `priority` | `priority` | `VARCHAR(20)` | `enum('low','medium','high','urgent')` |
| `progress` | `progress` | `INTEGER` | 0–100 |
| `deadline` | `deadline` | `TIMESTAMPTZ` | Nullable |
| `budget` | `budget` | `NUMERIC(15,2)` | Nullable |
| `invoiceId` | `invoice_id` | `UUID` | FK → invoices.id, nullable |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | |
| `updatedAt` | `updated_at` | `TIMESTAMPTZ` | |
| — | `user_id` | `UUID` | FK → users.id, NOT NULL (owner) |

```sql
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'backlog'
                CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  priority    VARCHAR(20) NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline    TIMESTAMPTZ,
  budget      NUMERIC(15,2),
  invoice_id  UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_deadline ON projects(deadline);
```

### 3.4 `users/{uid}/clients/{clientId}` → `clients` table

Firestore path: `users/{uid}/clients/{clientId}`

| Firestore Field | PostgreSQL Column | Type | Notes |
|---|---|---|---|
| `id` (doc ID) | `id` | `UUID` | Primary key |
| `name` | `name` | `VARCHAR(255)` | |
| `email` | `email` | `VARCHAR(255)` | Nullable |
| `whatsapp` | `whatsapp` | `VARCHAR(50)` | Nullable |
| `phone` | `phone` | `VARCHAR(50)` | Nullable |
| `company` | `company` | `VARCHAR(255)` | Nullable |
| `website` | `website` | `VARCHAR(255)` | Nullable |
| `address` | `address` | `TEXT` | Nullable |
| `notes` | `notes` | `TEXT` | Nullable |
| `totalRevenue` | `total_revenue` | `NUMERIC(15,2)` | Default 0 |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | |
| `updatedAt` | `updated_at` | `TIMESTAMPTZ` | |
| — | `user_id` | `UUID` | FK → users.id, NOT NULL (owner) |

```sql
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  whatsapp      VARCHAR(50),
  phone         VARCHAR(50),
  company       VARCHAR(255),
  website       VARCHAR(255),
  address       TEXT,
  notes         TEXT,
  total_revenue NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_email ON clients(email);
```

### 3.5 `users/{uid}/invoices/{invoiceId}` → `invoices` table

Firestore path: `users/{uid}/invoices/{invoiceId}`

| Firestore Field | PostgreSQL Column | Type | Notes |
|---|---|---|---|
| `id` (doc ID) | `id` | `UUID` | Primary key |
| `invoiceNumber` | `invoice_number` | `VARCHAR(50)` | Unique per user, e.g. `INV-2026-ABC` |
| `clientId` | `client_id` | `UUID` | FK → clients.id, NOT NULL |
| `title` | `title` | `VARCHAR(255)` | Nullable |
| `projectId` | `project_id` | `UUID` | FK → projects.id, nullable |
| `amount` | `amount` | `NUMERIC(15,2)` | NOT NULL |
| `amountPaid` | `amount_paid` | `NUMERIC(15,2)` | Default 0 |
| `tax` | `tax` | `NUMERIC(15,2)` | Default 0 |
| `discount` | `discount` | `NUMERIC(15,2)` | Default 0 |
| `status` | `status` | `VARCHAR(20)` | `enum('draft','sent','pending','paid','overdue','cancelled')` |
| `dueDate` | `due_date` | `TIMESTAMPTZ` | NOT NULL |
| `paidAt` | `paid_at` | `TIMESTAMPTZ` | Nullable |
| `notes` | `notes` | `TEXT` | Nullable |
| `items` (JSON array) | `items` | `JSONB` | Array of `{description, quantity, unitPrice, total}` |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | |
| `updatedAt` | `updated_at` | `TIMESTAMPTZ` | |
| — | `user_id` | `UUID` | FK → users.id, NOT NULL (owner) |

```sql
CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number  VARCHAR(50) NOT NULL,
  client_id      UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  title          VARCHAR(255),
  project_id     UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount         NUMERIC(15,2) NOT NULL,
  amount_paid    NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax            NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount       NUMERIC(15,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20) NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled')),
  due_date       TIMESTAMPTZ NOT NULL,
  paid_at        TIMESTAMPTZ,
  notes          TEXT,
  items          JSONB DEFAULT '[]'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique invoice number per user
  UNIQUE (user_id, invoice_number)
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_project_id ON invoices(project_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
```

### 3.6 `users/{uid}/projects/{projectId}/tasks/{taskId}` → `tasks` table

Firestore path: `users/{uid}/projects/{projectId}/tasks/{taskId}`

| Firestore Field | PostgreSQL Column | Type | Notes |
|---|---|---|---|
| `id` (doc ID) | `id` | `UUID` | Primary key |
| `title` | `title` | `VARCHAR(255)` | NOT NULL |
| `description` | `description` | `TEXT` | Nullable |
| `status` | `status` | `VARCHAR(20)` | `enum('todo','in_progress','done')` |
| `priority` | `priority` | `VARCHAR(20)` | `enum('low','medium','high','urgent')` |
| `assignee` | `assignee` | `VARCHAR(255)` | Nullable (free-text or user ID) |
| `dueDate` | `due_date` | `TIMESTAMPTZ` | Nullable |
| `order` | `order_index` | `INTEGER` | For sorting; `order` is reserved in Postgres |
| `createdAt` | `created_at` | `TIMESTAMPTZ` | |
| `updatedAt` | `updated_at` | `TIMESTAMPTZ` | |
| — | `project_id` | `UUID` | FK → projects.id, NOT NULL |

```sql
CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo', 'in_progress', 'done')),
  priority    VARCHAR(20) NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee    VARCHAR(255),
  due_date    TIMESTAMPTZ,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
-- Composite: (status ASC, order_index DESC) — matches Firestore composite index
CREATE INDEX idx_tasks_status_order ON tasks(status, order_index DESC);
```

---

## 4. Field Type Mapping

| Firestore Type | PostgreSQL Type | Notes |
|---|---|---|
| `string` | `VARCHAR(255)` or `TEXT` | Use `TEXT` for unlimited, `VARCHAR(n)` for bounded |
| `number` (integer) | `INTEGER` or `BIGINT` | |
| `number` (float/decimal) | `NUMERIC(15,2)` | For currency (IDR), up to 13 digits + 2 decimals |
| `boolean` | `BOOLEAN` | |
| `Timestamp` | `TIMESTAMPTZ` | Always UTC, timezone-aware |
| `null` in Firestore | `NULL` in Postgres | |
| `string[]` (tags) | `TEXT[]` | Or `JSONB` array |
| `object[]` (items) | `JSONB` | Array of objects stored as JSONB |
| Document ID | `UUID` | Auto-generated, `gen_random_uuid()` |

### Timestamp Handling

```typescript
// Firestore: store as TIMESTAMPTZ
// Client-side: convert with .toDate() (Firestore) → Date object
// PostgreSQL:  TIMESTAMPTZ → ISO string → new Date()

// In Prisma/Drizzle query result:
const createdAt = new Date(row.created_at); // TypeScript Date
```

---

## 5. API Routes → Server Actions / API

### 5.1 License Activation

**Current:** `POST /api/licenses/activate`

```
Firebase flow:
  1. Verify Bearer token (Firebase ID token) via Admin SDK
  2. Normalize + validate license key format (FOS-PRO-XXX)
  3. Find license doc by key
  4. Check status !== activated/revoked/expired
  5. Update license: status='activated', activatedBy=uid, activatedAt=now
  6. Update user doc: licenseKey, licenseStatus='active', plan
```

**PostgreSQL equivalent — Server Action:**

```typescript
// src/actions/licenses.ts
'use server';

import { auth } from '@/lib/auth'; // your auth provider
import { db } from '@/lib/db';      // Prisma/Drizzle client

export async function activateLicense(key: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const normalizedKey = key.toUpperCase().replace(/\s/g, '');

  // Validate format
  if (!/^FOS-(FREE|PRO|AGENCY)-[A-Z0-9]+(-[A-Z0-9]+)*$/.test(normalizedKey)) {
    throw new Error('Invalid license key format.');
  }

  // Find + lock license row
  const license = await db.query.licenses.findFirst({
    where: eq(licenses.key, normalizedKey),
  });

  if (!license) throw new Error('License key not found.');
  if (license.status === 'activated') throw new Error('Already activated.');
  if (['revoked', 'expired'].includes(license.status)) {
    throw new Error(`License has been ${license.status}.`);
  }

  const plan = license.type; // 'free' | 'pro' | 'agency'

  // Atomic transaction: update license + user
  await db.transaction(async (tx) => {
    await tx.update(licenses)
      .set({ status: 'activated', activatedBy: session.user.id, activatedAt: new Date() })
      .where(eq(licenses.id, license.id));

    await tx.update(users)
      .set({ licenseKey: normalizedKey, licenseStatus: 'active', plan, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));
  });

  return { valid: true, plan };
}
```

### 5.2 License Validation (Public)

**Current:** `POST /api/licenses/validate`

```
Firebase flow:
  1. Validate key format
  2. Find license by key
  3. Return { valid: bool, message, license: { id, type } }
  4. No auth required
```

**PostgreSQL equivalent — Server Action or public API route:**

```typescript
export async function validateLicense(key: string) {
  const normalizedKey = key.toUpperCase().replace(/\s/g, '');

  if (!/^FOS-(FREE|PRO|AGENCY)-[A-Z0-9]+(-[A-Z0-9]+)*$/.test(normalizedKey)) {
    return { valid: false, message: 'Invalid license key format.' };
  }

  const license = await db.query.licenses.findFirst({
    where: eq(licenses.key, normalizedKey),
  });

  if (!license) return { valid: false, message: 'License key not found.' };
  if (['revoked', 'expired'].includes(license.status)) {
    return { valid: false, message: `License has been ${license.status}.` };
  }
  if (license.status === 'activated') {
    return { valid: false, message: 'License key has already been activated.' };
  }

  return {
    valid: true,
    message: 'License key is valid.',
    license: { id: license.id, type: license.type },
  };
}
```

### 5.3 License Creation (Admin)

**Current:** `POST /api/licenses` (requires `x-admin-secret` header)

```
Firebase flow:
  1. Verify admin secret
  2. Generate doc ID from normalized key
  3. setDoc(licenseData)
```

**PostgreSQL equivalent — Admin-only Server Action:**

```typescript
export async function createLicenses(keys: Array<{ key: string; type: string }>) {
  // Verify admin secret or use role-based admin check
  if (process.env.ADMIN_SECRET !== secret) throw new Error('Unauthorized');

  const results = [];
  for (const { key, type } of keys) {
    const normalizedKey = key.toUpperCase().replace(/\s/g, '');
    try {
      const id = await db.insert(licenses).values({
        key: normalizedKey,
        type: type || 'pro',
        status: 'available',
        createdAt: new Date(),
      }).returning({ id: licenses.id });
      results.push({ key, status: 'created', id: id[0].id });
    } catch (err: any) {
      results.push({ key, status: 'error', message: err.message });
    }
  }
  return { results };
}
```

### 5.4 CRUD Services → Repository Pattern

Each Firestore service (`*Service.ts`) maps to a **Repository** module in the new backend.

```
Firestore Service          →  PostgreSQL Repository
─────────────────────────────────────────────────────
clientService.ts       →  repositories/clients.ts
projectService.ts      →  repositories/projects.ts
invoiceService.ts     →  repositories/invoices.ts
taskService.ts        →  repositories/tasks.ts
```

Example — `repositories/clients.ts`:

```typescript
import { db } from '@/lib/db';        // Drizzle/Prisma client
import { clients } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function createClient(userId: string, data: ClientFormData) {
  const [created] = await db.insert(clients).values({
    userId,
    name: data.name,
    email: data.email || null,
    whatsapp: data.whatsapp || null,
    phone: data.phone || null,
    company: data.company || null,
    website: data.website || null,
    address: data.address || null,
    notes: data.notes || null,
    totalRevenue: 0,
  }).returning();
  return created.id;
}

export async function getClients(userId: string) {
  return db.query.clients.findMany({
    where: eq(clients.userId, userId),
    orderBy: [desc(clients.createdAt)],
  });
}

export async function updateClient(id: string, userId: string, data: Partial<ClientFormData & { totalRevenue: number }>) {
  await db.update(clients).set({ ...data, updatedAt: new Date() })
    .where(and(eq(clients.id, id), eq(clients.userId, userId)));
}
```

---

## 6. Authentication Migration

### Current: Firebase Auth

```
Firebase Auth handles:
  - Email/password registration & login
  - JWT token management
  - Password reset
  - Session persistence
```

### Migration Options

| Provider | Pros | Cons |
|---|---|---|
| **Clerk** | Drop-in replacement, dev UX, webhook support | Paid for high volume |
| **Auth.js (NextAuth v5)** | Free, self-hosted, flexible | More setup |
| **Supabase Auth** | Free tier generous, works with Supabase DB | Vendor lock-in |
| **Lucia v3** | Lightweight, framework-agnostic | More manual work |

**Recommended for this project:** **Clerk** — closest DX to Firebase Auth, minimal migration effort.

### Auth Flow with Clerk

```typescript
// src/lib/auth.ts
import { clerkClient } from '@clerk/nextjs/server';

// Use Clerk's getAuth() in server components / actions
// Use useUser() hook in client components (replaces useAuth hook)

// User ID from Clerk:
//   Server: const { userId } = auth();
//   Client: const { user } = useUser(); user.id
```

### User Profile Sync

```typescript
// src/middleware.ts (Clerk webhook handler)
// Sync user to PostgreSQL on registration
// POST /webhooks/clerk — on user.created → insert into users table
```

### Replace `useAuth` Hook

```typescript
// src/features/auth/hooks/useAuth.ts
// OLD: useAuth() from Firebase
// NEW: useUser() from @clerk/nextjs

import { useUser } from '@clerk/nextjs';

export function useAuth() {
  const { user, isLoaded } = useUser();
  return {
    user: user ? { uid: user.id, email: user.emailAddresses[0]?.emailAddress } : null,
    loading: !isLoaded,
  };
}
```

---

## 7. License Key System

### License Key Format

```
FOS-{PLAN}-{RAND}-{RAND}
FOS-PRO-AB12-CD34
```

### Key → ID Mapping (Firestore → Postgres)

| | Firestore | PostgreSQL |
|---|---|---|
| Doc ID | `fosproab12cd34` (lowercase, no dashes) | `id` = UUID |
| Key stored | `FOS-PRO-AB12-CD34` | `key` = `FOS-PRO-AB12-CD34` |

In PostgreSQL: `key` column is the canonical identifier, `id` is internal UUID.

### Plan Determination

```typescript
const PLAN_FROM_LICENSE: Record<string, LicensePlan> = {
  FREE: 'free',
  PRO: 'pro',
  AGENCY: 'agency',
};
```

---

## 8. Security & Authorization

### Firestore Rules → PostgreSQL Row-Level Security (RLS)

**Firestore Security Rules:**

```javascript
// firestore.rules (current)
match /users/{userId} {
  allow read, create, update: if request.auth.uid == userId;
  allow delete: if false; // Never delete users
}
match /users/{userId}/projects/{projectId} {
  allow read, write: if request.auth.uid == userId;
}
```

**PostgreSQL Row-Level Security equivalent:**

```sql
-- Enable RLS on all user-owned tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: user can only access their own rows
CREATE POLICY users_own_projects ON projects
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY users_own_clients ON clients
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY users_own_invoices ON invoices
  FOR ALL USING (user_id = current_user_id());

CREATE POLICY users_own_tasks ON tasks
  FOR ALL USING (project_id IN (
    SELECT id FROM projects WHERE user_id = current_user_id()
  ));
```

Or use **Prisma/Drizzle middleware** for authorization (simpler than RLS):

```typescript
// src/lib/db/middleware/auth.ts
export function authMiddleware(prisma: any) {
  return prisma.$use(async (params: any, next: any) => {
    const userId = getCurrentUserId(); // from session/JWT
    if (['projects', 'clients', 'invoices', 'tasks'].includes(params.model)) {
      params.args.where = { ...params.args.where, user_id: userId };
    }
    return next(params);
  });
}
```

### API Route Authorization (Admin-only)

```typescript
// src/actions/admin.ts
export async function adminOnly() {
  const session = await auth();
  // In production: check session.user.role === 'admin'
  if (process.env.ADMIN_SECRET !== request.headers.get('x-admin-secret')) {
    throw new Error('Unauthorized');
  }
}
```

---

## 9. Composite Indexes → PostgreSQL Indexes

### Firestore Composite Indexes

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### PostgreSQL Equivalent

```sql
-- tasks: status ASC, order_index DESC
CREATE INDEX idx_tasks_status_order ON tasks(status ASC, order_index DESC);

-- licenses: key ASC, status ASC
CREATE INDEX idx_licenses_key_status ON licenses(key ASC, status ASC);

-- invoices: user_id ASC, invoice_number ASC
CREATE UNIQUE INDEX idx_invoices_user_invoice ON invoices(user_id, invoice_number);
```

---

## 10. Realtime Subscriptions → SSE / Polling

### Current: Firestore `onSnapshot`

```typescript
// All services use Firestore real-time listeners
subscribeToProjects(callback) // fires on every change
subscribeToClients(callback)
subscribeToInvoices(callback)
subscribeToTasks(projectId, callback)
```

### Migration Options

| Strategy | Pros | Cons | Best For |
|---|---|---|---|
| **Server-Sent Events (SSE)** | True real-time, efficient | Requires WS/SSE server | Invoices, Dashboard stats |
| **Supabase Realtime** | Built-in, similar to Firestore | Vendor lock-in | If using Supabase |
| **Polling (useSWR / React Query)** | Simple, cacheable | Not instant | Tasks, Projects (less critical) |
| **Ably / Pusher** | Managed, reliable | Extra service cost | Production apps |

**Recommended:** **Supabase Realtime** if migrating to Supabase, otherwise **polling with React Query/SWR** (simpler to implement).

### Example: React Query Polling (drop-in replacement)

```typescript
// src/hooks/useProjects.ts (new implementation)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProjects() {
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json()),
    refetchInterval: 30000, // Poll every 30s
    staleTime: 10000,
  });

  const addProject = useMutation({
    mutationFn: (data: ProjectFormData) =>
      fetch('/api/projects', { method: 'POST', body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  return { projects, loading: isLoading, addProject };
}
```

---

## 11. Offline Persistence

### Current: Firestore Offline Cache

```typescript
// config.ts — current setup
const cache = persistentLocalCache({
  tabManager: persistentMultipleTabManager(),
});
db = initializeFirestore(app, { localCache: cache });
```

### PostgreSQL Equivalent

Offline support is harder with PostgreSQL. Options:

| Strategy | Effort | UX |
|---|---|---|
| **IndexedDB via Dexie.js** | Medium | Best offline UX |
| **TanStack Query offline mutations** | Low | Queue writes, replay on reconnect |
| **Skip offline for MVP** | None | Writes fail when offline |

**Recommended:** TanStack Query offline mutations (simple, good UX for this app):

```typescript
// mutations are queued automatically when offline
const mutation = useMutation({
  mutationFn: createProject,
  onMutate: async (newData) => {
    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ['projects'] });
    const previous = queryClient.getQueryData(['projects']);
    queryClient.setQueryData(['projects'], (old) => [...(old || []), newData]);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['projects'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  },
});
```

---

## 12. File Storage

### Current: Firebase Storage

```
Used for:
  - User avatars (uploaded to Firebase Storage)
  - Project attachments (future feature)
Path: users/{uid}/avatars/{filename}
```

### Migration Options

| Provider | Notes |
|---|---|
| **Vercel Blob** | Recommended if on Vercel — simple, cheap |
| **AWS S3** | Standard, more setup |
| **Supabase Storage** | Good if using Supabase |
| **Cloudflare R2** | S3-compatible, free tier generous |

**Upload flow (Vercel Blob example):**

```typescript
// src/app/api/upload/route.ts
import { put } from '@vercel/blob';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File;

  const blob = await put(`${session.user.id}/${file.name}`, file, {
    access: 'public',
  });

  // Save URL to user profile
  await db.update(users).set({ avatar: blob.url }).where(eq(users.id, session.user.id));

  return Response.json({ url: blob.url });
}
```

---

## 13. Environment Variables

### Current (.env.local)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=freelancer-os-e837b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=freelancer-os-e837b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=freelancer-os-e837b.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Target (PostgreSQL)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/freelancer_os

# Auth Provider (Clerk example)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register

# Admin
ADMIN_SECRET=your-admin-secret

# Storage (Vercel Blob example)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# Optional: Redis for sessions (if not using DB sessions)
# REDIS_URL=redis://localhost:6379
```

---

## 14. Migration Checklist

### Phase 1 — Schema & Infrastructure
- [ ] Set up PostgreSQL database (Supabase / Neon / Vercel Postgres)
- [ ] Set up ORM (Prisma or Drizzle ORM)
- [ ] Create all tables with constraints and indexes
- [ ] Set up auth provider (Clerk recommended)
- [ ] Configure environment variables
- [ ] Set up RLS or application-level auth middleware

### Phase 2 — Auth Migration
- [ ] Integrate auth provider
- [ ] Replace `useAuth` hook with `useUser` (Clerk) or equivalent
- [ ] Migrate Firebase Auth users → new auth provider
- [ ] Test login, registration, logout, password reset
- [ ] Set up webhook to sync users to PostgreSQL on create

### Phase 3 — Data Migration
- [ ] Export existing Firestore data (JSON)
- [ ] Write migration script: Firestore JSON → PostgreSQL
- [ ] Map Firestore doc IDs → UUIDs
- [ ] Handle subcollection flattening (tasks under projects)
- [ ] Validate migrated data counts

### Phase 4 — Replace Firestore SDK
- [ ] Replace `lib/firebase/config.ts` with `lib/db/index.ts`
- [ ] Create repository modules per entity
- [ ] Replace Firestore service calls with repository calls
- [ ] Replace `onSnapshot` subscriptions with React Query polling
- [ ] Update all hooks (`useProjects`, `useClients`, `useInvoices`, `useTasks`)

### Phase 5 — License System
- [ ] Migrate `licenses` collection to `licenses` table
- [ ] Rewrite `/api/licenses/*` as Server Actions
- [ ] Verify license activation flow end-to-end
- [ ] Update `licenseService.ts` client functions

### Phase 6 — Storage
- [ ] Set up new storage provider
- [ ] Migrate existing files (Firebase Storage → new provider)
- [ ] Update avatar upload flow
- [ ] Update file download URLs

### Phase 7 — Cleanup
- [ ] Remove Firebase JS SDK (`firebase` package)
- [ ] Remove Firebase Admin SDK
- [ ] Remove `lib/firebase/` directory
- [ ] Remove `firestore.rules`, `firebase.json`
- [ ] Remove `NEXT_PUBLIC_FIREBASE_*` env vars
- [ ] Deploy and test on production

---

## Quick Reference: Firestore → Postgres Terminology

| Firestore | PostgreSQL |
|---|---|
| Collection | Table |
| Document | Row |
| Subcollection | Child table with FK |
| Doc ID (auto) | UUID (auto) |
| `Timestamp` | `TIMESTAMPTZ` |
| `array` | `JSONB` or `TEXT[]` |
| `onSnapshot` | React Query + polling / SSE |
| Security Rules | RLS / middleware |
| `FieldValue.serverTimestamp()` | `NOW()` (database default) |
| Batch write (`writeBatch`) | DB transaction |
| Composite Index | Composite B-tree Index |

---

## File-to-File Migration Map

```
Firebase SDK Files (DELETE after migration):
  src/lib/firebase/
    ├── config.ts         →  src/lib/db/index.ts (Prisma/Drizzle client)
    ├── admin.ts         →  src/lib/db/index.ts (same client, server-only)
    ├── constants.ts     →  src/lib/constants.ts (keep)
    └── checkConfig.ts   →  remove (Firebase-specific)

Service Files (REFACTOR to repositories):
  src/lib/services/clientService.ts   →  src/repositories/clients.ts
  src/lib/services/projectService.ts  →  src/repositories/projects.ts
  src/lib/services/invoiceService.ts  →  src/repositories/invoices.ts
  src/lib/services/taskService.ts     →  src/repositories/tasks.ts

Hooks (REFACTOR to use new repositories):
  src/hooks/useClients.ts    →  refactor to use repository + React Query
  src/hooks/useProjects.ts   →  refactor to use repository + React Query
  src/hooks/useInvoices.ts   →  refactor to use repository + React Query
  src/hooks/useTasks.ts      →  refactor to use repository + React Query

API Routes (REFACTOR to Server Actions):
  src/app/api/licenses/activate/route.ts  →  src/actions/licenses/activate.ts
  src/app/api/licenses/validate/route.ts   →  src/actions/licenses/validate.ts
  src/app/api/licenses/route.ts            →  src/actions/admin/createLicenses.ts

Auth (REPLACE):
  src/features/auth/services/authService.ts  →  @clerk/nextjs or chosen auth provider
  src/features/auth/hooks/useAuth.ts        →  refactor to new auth provider

License (REFACTOR):
  src/features/license/services/licenseService.ts  →  src/actions/licenses/*.ts
```
