# Clients CRM Plus — Design Spec

**Date:** 2026-05-14
**Project:** Freelancer OS
**Status:** Approved

---

## Overview

Clients CRM feature following CRM Plus tier — MVP + search/filter + contact info + revenue per client + stats + link ke project/invoice terkait.

## Tech Stack

- Next.js App Router
- TypeScript
- shadcn/ui components
- Firebase JS SDK (client-side, offline cache)
- date-fns for formatting

---

## File Structure

```
src/
├── lib/services/clientService.ts     # CRUD + real-time subscription
├── hooks/useClients.ts               # React hook for clients
├── components/clients/
│   ├── ClientCard.tsx                # Card view untuk grid
│   ├── ClientForm.tsx                # Add/Edit dialog
│   ├── ClientProfile.tsx             # Full profile dengan tabs
│   └── ClientList.tsx               # Grid layout + search
└── app/dashboard/clients/
    ├── page.tsx                      # List page
    └── [id]/
        └── page.tsx                 # Profile page
```

---

## Data Layer

### clientService.ts

CRUD operations following `projectService.ts` pattern:

```typescript
createClient(data: ClientFormData): Promise<string>
getClient(id: string): Promise<Client | null>
updateClient(id: string, data: Partial<ClientFormData>): Promise<void>
deleteClient(id: string): Promise<void>
subscribeToClients(callback): () => void
```

**Firestore path:** `users/{uid}/clients/{clientId}`

### Revenue Sync

`totalRevenue` di client doc diupdate setiap kali invoice status berubah ke `paid`:

- Di `useInvoices` hook: saat `markAsPaid` → recalculate dari semua invoice client yang paid → update client doc
- Ini dilakukan secara client-side saat invoice status berubah

---

## UI Components

### ClientCard.tsx

- Avatar dengan initial letter atau initials dari name
- Name, company, email, WhatsApp preview
- Stats badges: total projects, active projects, total revenue (formatted IDR)
- Edit button (opens form), View button (navigates ke profile)
- Delete button dengan confirmation

### ClientForm.tsx

Dialog-based form:

- Fields: Name\* (required), Email, WhatsApp, Phone, Company, Website, Address, Notes
- Validation: name required, email format check
- Use existing Dialog + Input + Label + Button + Textarea components
- Submit calls parent handler with form data

### ClientProfile.tsx

Full client detail view:

- Header: avatar, name, company, contact links (WhatsApp, email, website)
- 4 stats cards: Total Revenue, Total Projects, Active Projects, Total Invoices Paid
- Tabbed sections: Projects | Invoices | Notes
- Inline actions: Edit (opens form), Delete

### ClientList.tsx

Grid layout:

- Search bar (debounced, filters by name/company)
- Filter tabs: All | Has Projects | Has Invoices
- Sort: Recent | Name A-Z | Revenue High-Low
- Responsive grid 1-3 columns
- Empty state dengan CTA button

---

## Pages

### /dashboard/clients (List Page)

```
Header: "Clients" + search input + "Add Client" button
Stats Row (4): Total Clients | Total Revenue | Active Projects | Avg Revenue/Client
Filter Tabs: All | Has Projects | Has Invoices
Client Grid: 2-3 col responsive cards
```

### /dashboard/clients/[id] (Profile Page)

```
Back button | Client Name | Edit | Delete actions
Client info header: avatar, name, company, contact buttons
Stats row: 4 metric cards
Tabs: Projects | Invoices | Notes
Content area based on active tab
```

---

## Integration Points

### Invoice → Client Revenue Sync

In `useInvoices` hook:

1. `markAsPaid(id)` is called
2. After updating invoice status, recalculate total from all paid invoices for that clientId
3. Call `updateClient(clientId, { totalRevenue })` to sync

### Project Links

- Client profile page fetches projects where `clientId === currentClientId`
- Use `query(projectsRef(), where("clientId", "==", clientId))` via Admin SDK... wait, for client-side we use JS SDK with `getDocsFromCache` first then `getDocsFromServer`. But browser restrictions make direct Firestore calls unreliable.

**Solution:** Client profile page fetches all projects/invoices via existing hooks, then filters client-side:

```typescript
const clientProjects = useMemo(
  () => projects.filter((p) => p.clientId === clientId),
  [projects, clientId],
);
```

### ClientService for filtered queries

Add helper to clientService for getting client-specific data:

```typescript
// Fetches all projects for a specific client (client-side filter)
export async function getProjectsByClient(clientId: string): Promise<Project[]>;
// Fetches all invoices for a specific client (client-side filter)
export async function getInvoicesByClient(clientId: string): Promise<Invoice[]>;
```

Note: Real-time subscription still uses `subscribeToProjects()` and `subscribeToInvoices()` from existing hooks. Filter happens client-side.

---

## Styling & Design

- Dark mode first (matches existing design system)
- Minimal, premium aesthetic (Linear/Notion inspired)
- Cards: `bg-card` with `border-border`
- Stats cards: colored icon backgrounds matching finance page
- Avatar: circular, colored background with initials
- Use Badge component for status pills

---

## Implementation Order

1. `clientService.ts` — CRUD + subscription
2. `useClients.ts` hook
3. `ClientForm.tsx` — Add/Edit dialog
4. `ClientCard.tsx` — Card component
5. `/dashboard/clients/page.tsx` — List page
6. `/dashboard/clients/[id]/page.tsx` — Profile page
7. `ClientProfile.tsx` — Profile component with tabs
8. Invoice → Client revenue sync in `useInvoices`
9. Update InvoiceForm to support selecting clients for dropdown

---

## Notes

- InvoiceForm currently uses `clientId` as free text input. After clients feature, update to searchable Select/Dialog dropdown to pick from existing clients.
- Client deletion: hard delete (Firestore delete). Warn if client has associated projects/invoices.
- Total revenue update is async and best-effort (doesn't block invoice update).
