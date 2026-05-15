# Design Spec: Clients & Finance — Consistent Table Layout

**Date:** 2026-05-15
**Project:** Freelancer OS
**Status:** Approved

---

## Overview

Convert Clients and Finance pages from card-grid layout to table layout — consistent with the Projects page pattern. Reference: `src/app/dashboard/projects/page.tsx`.

**Key principle:** Both pages already have search/filter infrastructure. Only the presentation layer changes from card grid to table.

---

## Clients Page — Table Layout

### Layout Structure

```
┌──────────────────────────────────────────────────────┐
│  Clients                              [+ Add Client] │
├──────────────────────────────────────────────────────┤
│  [Total: 12]                      [Total Revenue: Rp 50jt]  │  ← minimal stats
├──────────────────────────────────────────────────────┤
│  [Search...]                        [Name▼] [Revenue▼]  │  ← sort by header
├──────────────────────────────────────────────────────┤
│  [All (12)] [Has Projects (8)]                       │  ← filter tabs
├──────────────────────────────────────────────────────┤
│  # | Name         | Company | Contact | Projects | Revenue | Actions │
│  1 | John Doe      | Acme Co | john@.. | 3        | Rp 15jt | [✏][🗑] │
│  2 | Jane Smith    | —       | jane@.. | 1        | Rp 5jt  | [✏][🗑] │
├──────────────────────────────────────────────────────┤
│  Showing 1-10 of 12                    [← Prev] [1] [Next →] │
└──────────────────────────────────────────────────────┘
```

### Stats

- Show only 2 stats: **Total Clients** + **Total Revenue**
- Replaces current 4-card stats row
- Compact horizontal layout

### Table Columns

| Column   | Width  | Content                                           |
| -------- | ------ | ------------------------------------------------- |
| #        | `w-12` | Row number (start–idx)                            |
| Name     | flex-1 | Clickable → `/dashboard/clients/[id]`, truncated  |
| Company  | `w-32` | Company name or `—`                               |
| Contact  | `w-48` | Email (mailto:) + WhatsApp icon (wa.me link)      |
| Projects | `w-16` | Project count                                     |
| Revenue  | `w-28` | formatIDR, sorted                                 |
| Actions  | `w-20` | Edit (Pencil) + Delete (Trash2), stop propagation |

### Sort

- Click column header to sort ASC; click again for DESC
- Visual indicator: `↓` / `↑` arrow next to active sort column
- Sortable: Name (alphabetical), Revenue (numeric)
- Default sort: Recent (maintained from service, no sort change)

### Search + Filter

- Search input with clear button (debounce 300ms) — **keep existing pattern**
- Filter tabs: "All (X)" | "Has Projects (Y)" — **keep existing tabs from ClientList**
- Sort dropdown (Recent / Name A-Z / Revenue) **removed** (replaced by header sort)

### Pagination

- PAGE_SIZE = 10 — same as Projects
- Pagination controls at table bottom

### Loading

- `<Skeleton className="h-96 rounded-xl" />` — same as Projects

### Empty State

- Dashed border box with icon + message + CTA button — same as Projects

---

## Finance Page — Table Layout

### Layout Structure

```
┌──────────────────────────────────────────────────────┐
│  Finance                              [+ New Invoice] │
├──────────────────────────────────────────────────────┤
│  [Revenue: Rp 80jt]    [Outstanding: Rp 15jt]        │  ← minimal stats
├──────────────────────────────────────────────────────┤
│  [All (24)] [Draft (5)] [Sent (8)] [Paid (10)] [Overdue (1)] │  ← Tabs kept
├──────────────────────────────────────────────────────┤
│  # | Invoice # | Client | Project | Amount | Due | Status | Actions │
│  1 | INV-2026-001 | John D. | Website | Rp 5jt | 20 May | Sent | [✏][⋮] │
│  2 | INV-2026-002 | Jane S. | Logo | Rp 2jt | 15 May | Paid | [✏][⋮] │
└──────────────────────────────────────────────────────┘
```

### Stats

- Show only 2 stats: **Total Revenue** + **Outstanding**
- Replaces current 4-card stats row
- Compact horizontal layout

### Table Columns

| Column    | Width  | Content                                         |
| --------- | ------ | ----------------------------------------------- |
| #         | `w-12` | Row number                                      |
| Invoice # | `w-32` | Monospace font (font-mono), same as InvoiceCard |
| Client    | `w-32` | Clickable → `/dashboard/clients/[clientId]`     |
| Project   | `w-28` | Project title or `—`                            |
| Amount    | `w-28` | formatIDR, sorted                               |
| Due Date  | `w-28` | format (dd MMM yyyy), overdue = red             |
| Status    | `w-20` | Badge with STATUS_CONFIG                        |
| Actions   | `w-20` | Edit (Pencil) + DropdownMenu (MoreHorizontal)   |

### Sort

- Click column header to sort ASC/DESC
- Sortable: Invoice #, Amount, Due Date
- Default: Most recent (by createdAt desc)

### Status Filter (Tabs — kept)

- Already exists: `All | Draft | Sent | Paid | Overdue`
- Keep as-is, filter is applied before pagination

### Actions Cell

- Edit button (Pencil icon) — inline
- DropdownMenu (MoreHorizontal) with:
  - **Send Invoice** — if `status === 'draft'`
  - **Mark as Paid** — if `status === 'sent' || 'overdue' || 'pending'`
  - Delete (variant="destructive")

### Pagination

- PAGE_SIZE = 10
- Pagination controls at table bottom

### Loading / Empty State

- Same pattern as Clients table

---

## Key Decisions

1. **Stats minimal** — only 2 stats per page (Total + one context-specific metric). Consistent with user preference for "minimal stats + table".

2. **Header sort replaces dropdown sort** — clean, no redundant controls.

3. **InvoiceCard and ClientCard kept** — still valuable for detail views, future quick-view popovers. Not deleted.

4. **ClientList component kept** — still useful for non-table contexts (e.g., if client selector is needed elsewhere).

5. **Finance actions in table** — DropdownMenu handles Send/Mark Paid, Edit is inline. Cleaner than card's split button layout.

---

## Component Inventory

| Component                                 | Action                                                       |
| ----------------------------------------- | ------------------------------------------------------------ |
| `src/app/dashboard/clients/page.tsx`      | **Rewrite** — minimal stats, search, tabs, table, pagination |
| `src/app/dashboard/finance/page.tsx`      | **Rewrite** — minimal stats, tabs, table, pagination         |
| `src/app/dashboard/page.tsx`              | No changes (user confirmed not in scope)                     |
| `src/components/clients/ClientList.tsx`   | **Keep** — not modified, still exportable for other uses     |
| `src/components/invoices/InvoiceCard.tsx` | **Keep** — not modified                                      |
| `src/components/clients/ClientCard.tsx`   | **Keep**                                                     |

---

## Implementation Order

1. Rewrite `clients/page.tsx` — table layout
2. Rewrite `finance/page.tsx` — table layout
3. Verify both pages load correctly
4. Verify search/filter/pagination/sort work
5. Commit
