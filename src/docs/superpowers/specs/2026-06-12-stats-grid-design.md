# Design Spec: Reusable Stats Grid System

**Date:** 2026-06-12
**Status:** Approved

---

## Overview

Refactor stats cards di semua dashboard page (Projects, Clients, Finance) menjadi sistem data-driven yang reusable. Setiap page cukup lempar props/config, tidak perlu hardcode JSX per card.

---

## Component Architecture

### `StatsCard` — Atomic Reusable Card

Single card yang bisa dipakai langsung (di dalam grid atau standalone di detail page).

**Props:**
```tsx
type StatsCardProps = {
  label: string;                           // "Total Projects"
  value: string | number;                  // 42 / "Rp 50jt"
  sub?: string;                            // "All time" — single line
  subColor?: 'default' | 'red' | 'yellow' | 'green';
  icon?: React.ReactNode;                  // <FolderKanban className="h-5 w-5" />
  className?: string;
};
```

### `StatsGrid` — Reusable Container

Grid container yang menerima array items dan render cards secara otomatis.

**Props:**
```tsx
type StatsGridProps = {
  items: StatsCardProps[];
  cols?: 2 | 3 | 4;                        // default: 4
  className?: string;
};
```

**Grid layout:**
```tsx
// cols={4} → grid-cols-2 lg:grid-cols-4
// cols={3} → grid-cols-1 lg:grid-cols-3
// cols={2} → grid-cols-1 lg:grid-cols-2
```

---

## Usage Pattern

### In page.tsx

```tsx
import { StatsGrid, StatsCard } from '@/components/dashboard';

// Standalone card
<StatsCard label="Total" value={42} sub="count" />

// Via grid
<StatsGrid
  cols={4}
  items={[
    { label: 'Total Projects', value: stats.total, sub: 'All time' },
    { label: 'Active', value: stats.active, sub: 'In progress', subColor: 'yellow' },
    { label: 'Completed', value: stats.done, sub: 'Done', subColor: 'green' },
    { label: 'Overdue', value: stats.overdue, sub: 'Need attention', subColor: 'red' },
  ]}
/>
```

### Page compute → render

```tsx
// Page still computes stats with useMemo
const stats = useMemo(() => {
  return {
    total: projects.length,
    active: projects.filter(...).length,
    // ...
  };
}, [projects]);

// Render with StatsGrid — declarative
<StatsGrid cols={4} items={[
  { label: 'Total Projects', value: stats.total, icon: <FolderKanban /> },
  // ...
]} />
```

---

## Files

### New Files

| File | Description |
|------|-------------|
| `src/components/dashboard/StatsCard.tsx` | Atomic card component — extracted logic from `SummaryCard.tsx` |
| `src/components/dashboard/StatsGrid.tsx` | Grid container component |

### Refactored Files

| File | Change |
|------|--------|
| `src/app/dashboard/projects/page.tsx` | Replace `SummaryCardGrid` + hardcoded cards with `StatsGrid` |
| `src/app/dashboard/clients/page.tsx` | Same |
| `src/app/dashboard/finance/page.tsx` | Same |
| `src/app/dashboard/page.tsx` | Optional — refactor stats section |

### Deprecation

| File | Action |
|------|--------|
| `src/components/dashboard/SummaryCard.tsx` | Soft deprecate — re-export from `StatsCard` for backward compat |
| `src/components/dashboard/SummaryCardGrid` | Remove — replaced by `StatsGrid` |

---

## Design Decisions

1. **`value` pre-formatted in page** — StatsGrid menerima string/number yang sudah diformat. Tidak ada formatter function di config. Page compute di `useMemo`, pass formatted value ke grid.

2. **Icon passed as ReactNode** — Page import lucide icons dan pass langsung. Tidak ada icon registry. Fleksibel untuk semua use case.

3. **Single-line sub only** — Sub text 1 baris. Card height konsisten, tidak ada inkonsistensi antar card.

4. **Backward compatible** — `SummaryCard` tetap exportable (re-export dari `StatsCard`) supaya tidak ada breaking change di component consumers.

5. **Cols configurable** — Default 4, tapi bisa 2 atau 3. Grid layout responsive.

---

## Implementation Order

1. Create `StatsCard.tsx` — extract from `SummaryCard.tsx`
2. Create `StatsGrid.tsx` — grid container using `StatsCard`
3. Refactor `projects/page.tsx`
4. Refactor `clients/page.tsx`
5. Refactor `finance/page.tsx`
6. Update `SummaryCard.tsx` to re-export `StatsCard` (backward compat)
7. Commit