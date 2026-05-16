# Freelancer OS — Client↔Project↔Invoice Sync & UX Design Spec

**Date:** 2026-05-14
**Project:** Freelancer OS
**Status:** Approved

---

## Overview

Menyinkronkan 3 modul (Client, Project, Invoice) agar saling berkorelasi dan mengurangi interaction cost saat membuat entity baru. Fokus: UX flow yang natural dan seamless.

---

## UX Philosophy

**Center of gravity = Project.** Semua flow berputar di project karena di situnya revenue terjadi.

Natural flow:

```
Client baru → Project → Invoice
```

---

## Section 1 — ProjectForm: Client Selector + Quick-Add Sheet

**File:** `src/components/projects/ProjectForm.tsx`

**Change:**

- Add client selector field (optional) — searchable dropdown
- Same pattern as InvoiceForm client selector: Command + Popover
- "Add New Client" button → opens slide-over sheet (QuickAddClientSheet)

**QuickAddClientSheet:**

- New component: `src/components/clients/QuickAddClientSheet.tsx`
- Uses `Sheet` from shadcn/ui (right-side slide-over)
- Fields: Name\*, Email, WhatsApp, Company, Notes (simplified)
- On submit: creates client → auto-selects it in ProjectForm
- Does NOT close ProjectForm — stays open with client selected

---

## Section 2 — InvoiceForm: Project Selector + Client Auto-Fill

**File:** `src/components/invoices/InvoiceForm.tsx`

**Field ordering:**

```
Client * (searchable dropdown)
  ↓
Project (searchable dropdown — filtered by selected client)
Amount *
Tax / Discount
Due Date
Notes
```

**Logic:**

- User selects project → `clientId` auto-filled from project's `clientId`
- Client field becomes read-only after auto-fill — user can override
- Project dropdown filtered by selected client (if client selected first)
- Projects with `clientId = null` still allowed (no client = valid state)

---

## Section 3 — InvoiceCard & ClientCard Enhancements

**InvoiceCard** (`src/components/invoices/InvoiceCard.tsx`):

- Display client name (resolved via `useClients().getClientById()`)
- Display project title (resolved via `useProjects()`)
- Client name clickable → navigate to `/dashboard/clients/[clientId]`
- "No client" / "No project" for empty states

**ClientCard** (`src/components/clients/ClientCard.tsx`):

- Add invoice count badge using `useInvoices` hook

---

## Section 4 — Sidebar: Quick-Create FAB

**File:** `src/components/shared/Sidebar.tsx`

- Floating `+` button at bottom-right of sidebar
- Click → popover with 3 actions: New Client, New Project, New Invoice
- Each opens respective form dialog (reuses existing components)
- After success → dialog close + toast

---

## Component Inventory

| Component                                        | Action                                               |
| ------------------------------------------------ | ---------------------------------------------------- |
| `src/components/clients/QuickAddClientSheet.tsx` | **NEW** — slide-over for inline client creation      |
| `src/components/projects/ProjectForm.tsx`        | **MODIFY** — add client selector + quick-add trigger |
| `src/components/invoices/InvoiceForm.tsx`        | **MODIFY** — add project selector + client auto-fill |
| `src/components/invoices/InvoiceCard.tsx`        | **MODIFY** — resolve client/project names            |
| `src/components/shared/Sidebar.tsx`              | **MODIFY** — add quick-create FAB                    |
| `src/components/clients/ClientCard.tsx`          | **MODIFY** — add invoice count badge                 |

---

## Data Flow

```
Client ←─── clientId ───→ Project
  ↑                      ↑
  │ (auto-fill)          │
  └─────── projectId ────┘
         Invoice
```

---

## Firestore Indexes Needed

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "fields": [{ "fieldPath": "clientId", "order": "ASCENDING" }]
    },
    {
      "collectionGroup": "invoices",
      "fields": [{ "fieldPath": "clientId", "order": "ASCENDING" }]
    },
    {
      "collectionGroup": "invoices",
      "fields": [{ "fieldPath": "projectId", "order": "ASCENDING" }]
    }
  ]
}
```

---

## Implementation Order

1. `QuickAddClientSheet.tsx` — new component
2. `ProjectForm.tsx` — add client selector + quick-add trigger
3. `InvoiceForm.tsx` — add project selector + client auto-fill
4. `InvoiceCard.tsx` — resolve client/project names
5. `ClientCard.tsx` — add invoice count badge
6. `Sidebar.tsx` — add quick-create FAB
7. Firestore indexes — add composite indexes
