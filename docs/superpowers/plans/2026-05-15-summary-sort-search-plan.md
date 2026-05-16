# Summary Cards, Table Search & Sort, Enhanced Navbar — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add summary cards, search bar, column header sorting, and enhanced navbar across Projects, Clients, and Finance pages.

**Architecture:** Create reusable components (`TableSearchBar`, `SortHeader`, `EmptyState`) and refine existing `SummaryCard`. Modify `Header.tsx` for enhanced page title + breadcrumb. Update three page files to use new components.

**Tech Stack:** React 19, TypeScript, shadcn/ui, Lucide React, Tailwind CSS

---

## File Map

| Action | File |
|--------|------|
| Create | `src/components/dashboard/TableSearchBar.tsx` |
| Create | `src/components/dashboard/SortIcon.tsx` |
| Create | `src/components/shared/EmptyState.tsx` |
| Modify | `src/components/shared/Header.tsx` |
| Modify | `src/components/dashboard/SummaryCard.tsx` |
| Modify | `src/app/dashboard/projects/page.tsx` |
| Modify | `src/app/dashboard/clients/page.tsx` |
| Modify | `src/app/dashboard/finance/page.tsx` |

---

## Task 1: Create SortIcon Component

**Files:**
- Create: `src/components/dashboard/SortIcon.tsx`

- [ ] **Step 1: Create SortIcon component**

The component needs to handle 3-state cycling: inactive → asc → desc → inactive.

```tsx
'use client';

import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortIconProps {
  field: string;
  sortField: string;
  sortDir: 'asc' | 'desc' | null;
  onSort: (field: string) => void;
}

export function SortIcon({ field, sortField, sortDir, onSort }: SortIconProps) {
  const isActive = sortField === field && sortDir !== null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSort(field);
  };

  if (!isActive) {
    return (
      <ChevronsUpDown
        className="text-muted-foreground/30 h-3.5 w-3.5 transition-opacity hover:opacity-100"
        onClick={handleClick}
      />
    );
  }

  return sortDir === 'asc' ? (
    <ArrowUp className="text-primary h-3.5 w-3.5" onClick={handleClick} />
  ) : (
    <ArrowDown className="text-primary h-3.5 w-3.5" onClick={handleClick} />
  );
}
```

- [ ] **Step 2: Update handleSort logic in all three pages**

The current `handleSort` in all three pages toggles between asc/desc only. Change it to cycle: asc → desc → clear.

In each page, replace `handleSort` with:

```tsx
const handleSort = (field: SortField) => {
  if (sortField === field) {
    if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      // Clear sort — go back to 'recent' default
      setSortField('recent');
      setSortDir(null);
    }
  } else {
    setSortField(field);
    setSortDir('asc');
  }
  setPage(1);
};
```

The sort field type should allow `'recent' | 'title' | ... | null` for the cleared state. Update the type to: `type SortField = 'recent' | 'title' | 'priority' | 'budget' | 'deadline' | null;`

---

## Task 2: Create TableSearchBar Component

**Files:**
- Create: `src/components/dashboard/TableSearchBar.tsx`

- [ ] **Step 1: Create TableSearchBar component**

```tsx
'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useState } from 'react';

interface TableSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TableSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}: TableSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync external value changes (e.g. reset from parent)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedValue = useDebounce(localValue, 300);

  // Notify parent only when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  return (
    <div className={className}>
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="pr-8 pl-9"
        />
        {localValue && (
          <button
            onClick={() => {
              setLocalValue('');
              onChange('');
            }}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Task 3: Create EmptyState Component

**Files:**
- Create: `src/components/shared/EmptyState.tsx`

- [ ] **Step 1: Create EmptyState component**

```tsx
'use client';

import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center ${className || ''}`}>
      <div className="text-muted-foreground/30 mb-4">
        {icon || <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 text-sm">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
```

---

## Task 4: Enhance Header Component

**Files:**
- Modify: `src/components/shared/Header.tsx`

- [ ] **Step 1: Update Header title styling and add breadcrumb**

Replace the simple `h1` with enhanced title + breadcrumb.

```tsx
// In Header.tsx, replace the title section:
// Replace:
{title && <h1 className="text-xl font-semibold tracking-tight">{title}</h1>}

// With:
{title && (
  <div className="flex flex-col">
    <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
    <p className="text-muted-foreground text-xs">Dashboard / {title}</p>
  </div>
)}
```

Note: Keep `getDashboardTitle()` usage — no change to the context mechanism.

---

## Task 5: Refine SummaryCard Component

**Files:**
- Modify: `src/components/dashboard/SummaryCard.tsx`

- [ ] **Step 1: Add hover effect and icon positioning**

The existing `SummaryCard` has label/value/sub. Add `icon` prop with top-right positioning and hover effect.

```tsx
export function SummaryCard({
  label,
  value,
  sub,
  subColor = 'default',
  icon,
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        'bg-card border-border group flex flex-col justify-center rounded-xl border px-5 py-4 transition-colors hover:bg-muted/50',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <p className="text-muted-foreground mb-1 text-xs font-medium">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {sub && (
            <p
              className={cn(
                'mt-0.5 text-xs',
                subColor === 'red' && 'text-red-400',
                subColor === 'yellow' && 'text-yellow-500',
                subColor === 'green' && 'text-green-500',
                subColor === 'default' && 'text-muted-foreground',
              )}
            >
              {sub}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Task 6: Update Projects Page

**Files:**
- Modify: `src/app/dashboard/projects/page.tsx`

- [ ] **Step 1: Import new components**

Add to imports:

```tsx
import { TableSearchBar } from '@/components/dashboard/TableSearchBar';
import { SortIcon } from '@/components/dashboard/SortIcon';
import { EmptyState } from '@/components/shared/EmptyState';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
```

Remove the local `SortIcon` function (lines ~63-70) — replace with imported component.

- [ ] **Step 2: Update SortField type for 3-state cycling**

```tsx
type SortField = 'recent' | 'title' | 'priority' | 'budget' | 'deadline' | null;
```

- [ ] **Step 3: Update handleSort for 3-state cycling**

Replace the current `handleSort` with:

```tsx
const handleSort = (field: string) => {
  if (sortField === field) {
    if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortField('recent');
      setSortDir(null);
    }
  } else {
    setSortField(field as SortField);
    setSortDir('asc');
  }
  setPage(1);
};
```

- [ ] **Step 4: Replace summary cards with SummaryCard components**

Replace the 4 inline `SummaryCardGrid` div cards with:

```tsx
<SummaryCardGrid>
  <SummaryCard
    label="Total Projects"
    value={stats.total}
    sub="All time"
    icon={<FolderKanban className="h-6 w-6" />}
  />
  <SummaryCard
    label="Active"
    value={stats.active}
    sub="In progress"
    subColor="yellow"
    icon={<FolderKanban className="h-6 w-6" />}
  />
  <SummaryCard
    label="Completed"
    value={stats.done}
    sub="Done"
    subColor="green"
    icon={<FolderKanban className="h-6 w-6" />}
  />
  <SummaryCard
    label="Overdue"
    value={stats.overdue}
    sub="Need attention"
    subColor="red"
    icon={<FolderKanban className="h-6 w-6" />}
  />
</SummaryCardGrid>
```

Also import `FolderKanban` (already there), and import `SummaryCard`.

- [ ] **Step 5: Replace search input with TableSearchBar**

Replace the entire search section (lines ~253-276) with:

```tsx
<TableSearchBar
  value={search}
  onChange={(v) => {
    setSearch(v);
    setPage(1);
  }}
  placeholder="Search projects or clients..."
  className="mb-0"
/>
```

Remove unused `Search` and `X` imports (already imported `Plus` etc. but check).

- [ ] **Step 6: Replace SortIcon in table headers with imported SortIcon**

Replace `SortIcon` usage in table headers. Current uses manual span + local `SortIcon` component — replace with:

```tsx
<TableHead className="text-muted-foreground cursor-pointer select-none text-xs font-medium group">
  <span className="flex items-center gap-1">
    Title
    <SortIcon field="title" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
  </span>
</TableHead>

<TableHead className="text-muted-foreground text-xs font-medium">Priority</TableHead>

<TableHead className="text-muted-foreground cursor-pointer select-none text-xs font-medium group">
  <span className="flex items-center gap-1">
    Budget
    <SortIcon field="budget" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
  </span>
</TableHead>

<TableHead className="text-muted-foreground text-xs font-medium">Progress</TableHead>

<TableHead className="text-muted-foreground cursor-pointer select-none text-xs font-medium group">
  <span className="flex items-center gap-1">
    Deadline
    <SortIcon field="deadline" sortField={sortField || ''} sortDir={sortDir} onSort={handleSort} />
  </span>
</TableHead>
```

- [ ] **Step 7: Replace empty state with EmptyState component**

Replace the inline empty state (lines ~279-296) with:

```tsx
{paginated.length === 0 && (
  <EmptyState
    icon={<FolderKanban className="h-16 w-16" />}
    title={search ? 'No projects found' : 'No projects yet'}
    description={
      search
        ? `No results for "${search}"`
        : 'Create your first project to start tracking work'
    }
    actionLabel={search ? 'Reset Filter' : 'Create Project'}
    onAction={search ? () => { setSearch(''); setPage(1); } : handleOpenNew}
  />
)}
```

- [ ] **Step 8: Remove inline page header button wrapper**

The page currently has a header div with "New Project" button. Keep it as-is (the Add button stays).

---

## Task 7: Update Clients Page

**Files:**
- Modify: `src/app/dashboard/clients/page.tsx`

Same pattern as Task 6 but for clients:

- Remove local `SortIcon` function (lines ~33-40), use imported `SortIcon`
- Update `SortField` type to include `null` for cleared state
- Update `handleSort` for 3-state cycling
- Replace inline summary card divs with `SummaryCard` components
- Replace search input with `TableSearchBar`
- Replace SortIcon in name and revenue columns
- Replace empty state with `EmptyState`
- Update stats computation to use `{ total, activeClients, totalRevenue }` matching the new card labels

Summary cards for clients:
- Total Clients → `stats.total`
- Active Clients → `stats.activeClients`
- Total Revenue → `formatIDR(stats.totalRevenue)`
- Avg Revenue → `formatIDR(stats.avgRevenue)`

---

## Task 8: Update Finance Page

**Files:**
- Modify: `src/app/dashboard/finance/page.tsx`

Same pattern as Task 6 but for finance:

- Remove local `SortIcon` function (lines ~68-75)
- Update `SortField` type to include `null`
- Update `handleSort` for 3-state cycling
- Replace inline summary cards with `SummaryCard` components (Revenue, Outstanding, Sent, Overdue)
- Replace search input with `TableSearchBar`
- Replace SortIcon in amount and due columns
- Replace empty state with `EmptyState`

Summary cards for finance:
- Total Revenue → `formatIDR(stats.totalRevenue)`, sub="Completed", subColor="green"
- Outstanding → `formatIDR(stats.outstanding)`, sub="Awaiting", subColor="yellow"
- Sent → `statusCounts.sent`, sub="In progress", subColor="blue"
- Overdue → `stats.overdue`, sub="Needs action", subColor="red"

---

## Verification

After all tasks, verify by running:

```bash
cd /Users/nicho/Research/freelance-os
npm run lint
```

Expected: No TypeScript errors, no ESLint errors.

Then verify visually that:
1. Projects, Clients, Finance pages all show breadcrumb in navbar
2. Summary cards have hover effects and icons on the right
3. Table search bars have clear buttons
4. Column headers can be clicked to sort (cycling asc → desc → clear)
5. Empty state shows friendly message with reset CTA