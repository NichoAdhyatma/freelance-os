# Summary Cards, Table Search & Sort, Enhanced Navbar — Design Spec

**Date:** 2026-05-15
**Project:** Freelancer OS

---

## 1. Enhanced Navbar Page Title

### Goal
Display page title + breadcrumb in the global `Header.tsx` instead of inline page headers.

### Current State
- `Header.tsx` receives title via `_dashboardTitle` context (set by each page via `setDashboardTitle()`)
- Title currently renders as plain text

### New State
- Page title: `text-lg font-semibold text-foreground`
- Breadcrumb below: `text-xs text-muted-foreground` → e.g., `Dashboard / Projects`
- Subtle separator between title and breadcrumb
- Tittle sourced from `setDashboardTitle()` which is already in place — no mechanism change needed

---

## 2. Summary Cards

### Goal
Refine existing `SummaryCardGrid` + `SummaryCard` components for visual consistency.

### Components
- `src/components/dashboard/SummaryCard.tsx` — existing, will refine
- Use `SummaryCardGrid` (already exists) with 4 cards per row

### Stat Cards Per Page

**Projects (`/dashboard/projects`):**
| Label | Value | Sub | Color |
|-------|-------|-----|-------|
| Total Projects | count | All time | default |
| Active | count | In progress | green |
| Completed | count | Done | blue |
| Overdue | count | Need attention | red |

**Clients (`/dashboard/clients`):**
| Label | Value | Sub | Color |
|-------|-------|-----|-------|
| Total Clients | count | All time | default |
| Active Projects | count | Ongoing | green |
| Total Revenue | Rp format | Combined | blue |
| New This Month | count | vs last month | green |

**Finance (`/dashboard/finance`):**
| Label | Value | Sub | Color |
|-------|-------|-----|-------|
| Total Invoice | count | All time | default |
| Paid | Rp amount | Completed | green |
| Pending | Rp amount | Awaiting | yellow |
| Overdue | Rp amount | Needs action | red |

### Visual Specs
- Card: `bg-card border-border rounded-xl`
- Value: `text-2xl font-bold text-foreground`
- Label: `text-sm font-medium text-muted-foreground`
- Sub: `text-xs text-muted-foreground`
- Hover: subtle `hover:bg-muted/50` transition
- Icon: optional lucide icon, top-right corner, muted

---

## 3. Table Search Bar

### Goal
Create a reusable `TableSearchBar` component with clean, integrated design.

### Component
- Create: `src/components/dashboard/TableSearchBar.tsx`

### Specs
```
┌──────────────────────────────────────────────┐
│ 🔍  Search projects...                          │
└──────────────────────────────────────────────┘
```
- Uses `Input` from shadcn/ui
- Search icon (lucide `Search`) on the left
- Clear button (lucide `X`) on the right when input has value
- Debounce: 300ms (use existing `useDebounce` hook from `src/lib/hooks/useDebounce.ts`)
- Placeholder text varies per page: "Search projects...", "Search clients...", "Search invoices..."

### Props Interface
```typescript
interface TableSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
```

---

## 4. Column Header Sorting

### Goal
Add click-to-cycle sorting (asc → desc → none) on table column headers.

### Components
- `src/components/dashboard/SortHeader.tsx` — new reusable component

### Behavior
1. Click 1x: sort ascending, show `↑` indicator (active)
2. Click 2x: sort descending, show `↓` indicator (active)
3. Click 3x: clear sort, indicator disappears
4. Active column: `font-medium text-primary` + subtle bottom border accent
5. Sortable columns: `cursor-pointer`
6. Non-sortable columns: `cursor-default` (no interaction)

### Specs
```tsx
// Usage in table header
<TableHead className="cursor-pointer select-none group">
  <div className="flex items-center gap-1">
    <span>Project Name</span>
    <SortIcon field="title" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
  </div>
</TableHead>
```

### Props Interface
```typescript
interface SortIconProps {
  field: string;
  sortField: string;
  sortDir: 'asc' | 'desc' | null;
  onSort: (field: string) => void;
}
```

### Visual
- Inactive: `text-muted-foreground opacity-40`
- Active asc: `text-primary opacity-100`
- Active desc: `text-primary opacity-100`
- Hover: `opacity-100 transition-opacity`

---

## 5. Empty State

### Goal
Show friendly empty state when search/filter returns no results.

### Component
- Create: `src/components/shared/EmptyState.tsx`

### Specs
```tsx
// Usage
{filteredData.length === 0 && search ? (
  <EmptyState
    title="Tidak ada hasil"
    description={`Pencarian "${search}" tidak ditemukan.`}
    actionLabel="Reset Filter"
    onAction={handleReset}
  />
) : (
  <Table>...</Table>
)}
```

### Visual
- Centered in table area
- Icon: lucide `Inbox` or `SearchX` (muted)
- Title: `text-lg font-semibold`
- Description: `text-sm text-muted-foreground`
- Action button: secondary style

---

## 6. Page-Level Changes

### Projects (`/dashboard/projects/page.tsx`)
- Remove inline page title (moved to navbar)
- Keep `SummaryCardGrid` + 4 stat cards
- Add `TableSearchBar` component
- Add `SortHeader` on columns: `title`, `status`, `deadline`
- Add `EmptyState` for no-result

### Clients (`/dashboard/clients/page.tsx`)
- Remove inline page title
- Keep `SummaryCardGrid` + 4 stat cards
- Add `TableSearchBar` component
- Add `SortHeader` on columns: `name`, `revenue`
- Add `EmptyState` for no-result

### Finance (`/dashboard/finance/page.tsx`)
- Remove inline page title
- Keep `SummaryCardGrid` + 4 stat cards
- Add `TableSearchBar` component
- Add `SortHeader` on columns: `amount`, `due`, `status`
- Add `EmptyState` for no-result

### Header Enhancement (`/src/components/shared/Header.tsx`)
- Title: `text-lg font-semibold`
- Add breadcrumb below: `Dashboard / {currentPage}`
- Subtle divider between title and page content area

---

## Files to Modify/Create

| Action | File |
|--------|------|
| Create | `src/components/dashboard/TableSearchBar.tsx` |
| Create | `src/components/dashboard/SortHeader.tsx` |
| Create | `src/components/shared/EmptyState.tsx` |
| Modify | `src/components/shared/Header.tsx` |
| Modify | `src/components/dashboard/SummaryCard.tsx` |
| Modify | `src/app/dashboard/projects/page.tsx` |
| Modify | `src/app/dashboard/clients/page.tsx` |
| Modify | `src/app/dashboard/finance/page.tsx` |

---

## Summary

All three listing pages (Projects, Clients, Finance) get:
1. **Enhanced navbar title** — breadcrumb + bigger title
2. **Summary cards** — refined hover, consistent colors
3. **Table search bar** — reusable component with clear button
4. **Sort headers** — click-to-cycle asc/desc/clear
5. **Empty state** — friendly no-result UI

No new dependencies required. Uses existing shadcn/ui components, lucide-react icons, and the existing `useDebounce` hook.