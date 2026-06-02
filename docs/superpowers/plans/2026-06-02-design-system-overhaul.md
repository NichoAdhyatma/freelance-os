# Design System Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Freelancer OS design system across 4 layers — tokens, typography, components, motion — applying a Professional SaaS aesthetic with Primary Action Blue theme and rich motion.

**Architecture:** Bottom-up approach. Update CSS variables in globals.css first (tokens + typography + motion), then build new components (StatusBadge), then apply changes across pages (dashboard, projects, clients, finance). Each layer builds on the previous.

**Tech Stack:** Next.js, Tailwind CSS v4, shadcn/ui v4 (base-nova), Base UI primitives, CSS variables theme, Plus Jakarta Sans + Inter fonts.

---

## File Structure

```
src/
├── app/
│   ├── globals.css          ← Modify: tokens, typography, motion, animations
│   └── layout.tsx            ← Modify: add Plus Jakarta Sans font
├── components/
│   ├── ui/
│   │   ├── status-badge.tsx  ← CREATE: new StatusBadge component
│   │   ├── card.tsx          ← Modify: add semantic surface defaults
│   │   ├── skeleton.tsx      ← Modify: add gradient pulse variant
│   │   └── badge.tsx         ← Inspect: ensure outline works with style props
│   └── shared/
│       ├── EmptyState.tsx    ← Modify: add subtle animations
│       └── Sidebar.tsx       ← Inspect: already uses CSS vars, no changes needed
├── lib/
│   ├── tokens.ts             ← Modify: ensure getAvatarStyle is exported
│   └── utils.ts              ← Modify: remove getAvatarColor duplicate
└── app/
    ├── dashboard/page.tsx   ← Modify: replace hardcoded colors, use StatusBadge
    ├── dashboard/projects/** ← Modify: use StatusBadge, update headings
    ├── dashboard/clients/**  ← Modify: use StatusBadge, update headings
    └── dashboard/finance/**  ← Modify: use StatusBadge, update headings
```

---

## Task 1: Layer 1 — Design Tokens & CSS Variables

**File:** `src/app/globals.css`

**Current state:** Uses neutral-gray `--primary` (`oklch(0.205 0 0)`). Hardcoded oklch values in dark mode surfaces.

**Steps:**

- [ ] **Step 1: Replace --primary in :root with blue system**

Find the `:root {` section and replace the `--primary` block:

```css
/* OLD (line ~58):
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
*/

--primary: oklch(0.55 0.16 235);
--primary-hover: oklch(0.50 0.17 235);
--primary-light: oklch(0.55 0.16 235 / 10%);
--primary-muted: oklch(0.55 0.16 235 / 15%);
--primary-foreground: oklch(1 0 0);
```

- [ ] **Step 2: Update surface system in :root**

Replace the surface tokens in `:root`:

```css
/* REPLACE existing --surface-base, --surface-raised, --surface-overlay, --surface-hover, --surface-active with: */
--surface-base:    oklch(1 0 0);
--surface-raised:  oklch(0.985 0 0);
--surface-overlay: oklch(1 0 0);
--surface-hover:   oklch(0.98 0 0);
--surface-active:   oklch(0.975 0 0);
```

- [ ] **Step 3: Update border system in :root**

Replace border tokens:

```css
/* REPLACE existing --border-subtle, --border-default with: */
--border-subtle:  oklch(0.94 0 0);
--border-default: oklch(0.90 0 0);
--border-strong:  oklch(0.82 0 0);
```

- [ ] **Step 4: Update text hierarchy in :root**

Replace text tokens (keep existing if already matching):

```css
--text-primary:    oklch(0.15 0 0);
--text-secondary:  oklch(0.40 0 0);
--text-tertiary:   oklch(0.55 0 0);
--text-disabled:   oklch(0.70 0 0);
```

- [ ] **Step 5: Update .dark overrides for primary and surfaces**

In the `.dark {` section (around line 116-182), replace `--primary`, `--primary-hover`, `--primary-foreground`, and surface tokens:

```css
/* REPLACE existing dark --primary block with: */
--primary:        oklch(0.62 0.16 235);
--primary-hover:  oklch(0.55 0.17 235);
--primary-light:  oklch(0.62 0.16 235 / 10%);
--primary-muted:  oklch(0.62 0.16 235 / 15%);
--primary-foreground: oklch(0.12 0.015 265);

/* REPLACE existing dark surface tokens with: */
--surface-base:    oklch(0.11 0.015 265);
--surface-raised:  oklch(0.16 0.015 265);
--surface-overlay: oklch(0.20 0.015 265);
--surface-hover:   oklch(0.22 0.015 265);
--surface-active:   oklch(0.26 0.015 265);

/* REPLACE existing dark border tokens with: */
--border-subtle:  oklch(1 0 0 / 5%);
--border-default: oklch(1 0 0 / 10%);
--border-strong:  oklch(1 0 0 / 18%);

/* REPLACE existing dark text tokens with: */
--text-primary:    oklch(0.97 0 0);
--text-secondary:  oklch(0.65 0 0);
--text-tertiary:   oklch(0.40 0 0);
--text-disabled:   oklch(0.30 0 0);
```

- [ ] **Step 6: Add motion tokens to :root**

After the animation durations section (after `--duration-slow: 250ms`), add easing curves:

```css
/* Easing curves */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out:    cubic-bezier(0, 0, 0.2, 1);
--ease-in:     cubic-bezier(0.4, 0, 1, 1);

/* Extended duration scale */
--duration-instant: 50ms;
--duration-fast:    100ms;
--duration-base:   150ms;
--duration-slow:    250ms;
--duration-slower: 350ms;
--duration-slowest: 500ms;

/* Motion utility classes */
.transition-spring {
  transition-timing-function: var(--ease-spring);
}
.transition-smooth {
  transition-timing-function: var(--ease-smooth);
}
.transition-out {
  transition-timing-function: var(--ease-out);
}
```

- [ ] **Step 7: Add entrance animation keyframes and classes to globals.css**

After the `@layer base { ... }` block, add:

```css
/* ── Entrance animations ───────────────────────── */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pageOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-4px); }
}

.animate-fade-in-up {
  animation: fadeInUp var(--duration-slow) var(--ease-out) both;
}

.page-enter {
  animation: pageIn var(--duration-slower) var(--ease-out) both;
}

/* Stagger children via data attribute */
[data-animate]:nth-child(1) { animation-delay: 0ms; }
[data-animate]:nth-child(2) { animation-delay: 50ms; }
[data-animate]:nth-child(3) { animation-delay: 100ms; }
[data-animate]:nth-child(4) { animation-delay: 150ms; }
[data-animate]:nth-child(5) { animation-delay: 200ms; }
[data-animate]:nth-child(6) { animation-delay: 250ms; }
[data-animate]:nth-child(7) { animation-delay: 300ms; }
[data-animate]:nth-child(8) { animation-delay: 350ms; }
```

- [ ] **Step 8: Add typography utility classes to globals.css**

After the animations, add:

```css
/* ── Typography utilities ─────────────────────── */
.font-heading {
  font-family: var(--font-heading);
  letter-spacing: -0.015em;
  font-weight: 600;
}

.text-display {
  font-size: 3rem;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.text-h1 {
  font-size: 2rem;
  line-height: 1.2;
  letter-spacing: -0.015em;
  font-weight: 600;
}

.text-h2 {
  font-size: 1.5rem;
  line-height: 1.3;
  letter-spacing: -0.01em;
  font-weight: 600;
}

.text-h3 {
  font-size: 1.125rem;
  line-height: 1.4;
  letter-spacing: -0.005em;
  font-weight: 600;
}

/* Semantic text utilities */
.text-heading  { color: var(--text-primary); }
.text-body     { color: var(--text-secondary); }
.text-caption  { color: var(--text-tertiary); }
.text-disabled  { color: var(--text-disabled); }

/* Micro-interaction utilities */
.hover-lift {
  transition: transform var(--duration-base) var(--ease-smooth),
              box-shadow var(--duration-base) var(--ease-smooth);
}
.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px oklch(0 0 0 / 8%);
}
```

- [ ] **Step 9: Update dark mode scrollbar and selection colors**

Find the `::-webkit-scrollbar-thumb:hover` and `::selection` blocks and update to use blue:

```css
::-webkit-scrollbar-thumb:hover {
  background: oklch(0.55 0.16 235 / 20%);
}

::selection {
  background: oklch(0.55 0.16 235 / 25%);
  color: oklch(1 0 0);
}
```

Also update dark mode scrollbar:

```css
/* In .dark section - add or update: */
.dark ::-webkit-scrollbar-thumb {
  background: oklch(1 0 0 / 10%);
}
.dark ::-webkit-scrollbar-thumb:hover {
  background: oklch(1 0 0 / 20%);
}
```

- [ ] **Step 10: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(design): add blue primary tokens, surface system, motion tokens, and typography utilities

- Replace --primary (gray) with blue system (oklch 0.55 0.16 235)
- Add surface hierarchy: base, raised, overlay, hover, active
- Add border hierarchy: subtle, default, strong
- Add text hierarchy: primary, secondary, tertiary, disabled
- Add motion tokens: spring/smooth/out easing, duration scale
- Add keyframes: fadeInUp, pageIn, pageOut
- Add utility classes: .font-heading, .text-h1/h2/h3, stagger animations
"
```

---

## Task 2: Layer 2 — Typography — Add Heading Font

**File:** `src/app/layout.tsx`

- [ ] **Step 1: Add Plus Jakarta Sans font import**

```typescript
// REPLACE current font imports:
import { Inter, JetBrains_Mono } from 'next/font/google';

// WITH:
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});
```

- [ ] **Step 2: Apply heading font to html element**

```tsx
// REPLACE:
<html className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}>

// WITH:
<html className={`${inter.variable} ${jetbrainsMono.variable} ${plusJakarta.variable} dark h-full antialiased`}>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(design): add Plus Jakarta Sans as heading font

Load Plus Jakarta Sans (500-800 weight) as --font-heading.
Apply alongside Inter (body) and JetBrains Mono (code).
All heading elements can now use .font-heading class."
```

---

## Task 3: Layer 3 — Component — Create StatusBadge

**File:** `src/components/ui/status-badge.tsx` (CREATE)

- [ ] **Step 1: Create StatusBadge component**

```tsx
'use client';

import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { getStatusStyle } from '@/lib/tokens';
import type { StatusStyle } from '@/lib/tokens';

interface StatusBadgeProps {
  config: Record<string, StatusStyle>;
  status: string;
  label?: string;
  size?: 'sm' | 'default';
  className?: string;
}

export function StatusBadge({
  config,
  status,
  label,
  size = 'default',
  className,
}: StatusBadgeProps) {
  const style = getStatusStyle(config, status);

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs px-2 py-0.5',
        className,
      )}
      {...style}
    >
      {label ?? status}
    </Badge>
  );
}
```

- [ ] **Step 2: Export getAvatarStyle from tokens.ts**

```typescript
// src/lib/tokens.ts
// Ensure getAvatarStyle is exported (it already exists but verify export):
export function getAvatarStyle(name: string): StatusStyle { ... }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/status-badge.tsx src/lib/tokens.ts
git commit -m "feat(design): add StatusBadge component

New StatusBadge wraps Badge with status token styling from tokens.ts.
Supports config (PROJECT_STATUS_CONFIG, etc.), status key, optional label,
and sm/default size. Replaces all inline style status badges across the app."
```

---

## Task 4: Layer 3 — Component — Card & Skeleton Updates

**Files:** `src/components/ui/card.tsx`, `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Update Card to use semantic surface tokens**

Card already uses `bg-card` which maps to `var(--card)`. Update the default class to use semantic surface for the base card:

```tsx
// In Card component, update data-slot="card" div className:
// CHANGE from:
'group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 ...'

// TO (use semantic surface tokens):
'group/card flex flex-col gap-4 overflow-hidden rounded-xl border border-border-default bg-surface-raised py-4 text-sm text-[var(--text-primary)] ring-1 ring-border-subtle ...'
```

Also update CardContent padding consistency:
```tsx
// CardContent already uses 'px-4' - verify it's consistent with surface tokens
// CardFooter uses 'bg-muted/50' - update to 'bg-surface-hover' if needed
```

- [ ] **Step 2: Enhance Skeleton with gradient pulse**

```tsx
// src/components/ui/skeleton.tsx
// REPLACE existing Skeleton with enhanced version:

'use client';

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  pulse = false,
  ...props
}: React.ComponentProps<'div'> & { pulse?: boolean }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        pulse
          ? 'animate-pulse rounded-md bg-gradient-to-r from-transparent via-foreground/5 to-transparent bg-[length:200%_100%]'
          : 'animate-pulse rounded-md bg-surface-hover',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/card.tsx src/components/ui/skeleton.tsx
git commit -m "refactor(design): update Card and Skeleton with semantic tokens

- Card: use bg-surface-raised, border-border-default, text-[var(--text-primary)]
  instead of bg-card/text-card-foreground for consistent surface system
- Skeleton: add pulse prop with gradient shimmer variant for rich loading states"
```

---

## Task 5: Layer 3 — Utils Cleanup — Remove Avatar Duplicate

**File:** `src/lib/utils.ts`

- [ ] **Step 1: Find all usages of getAvatarColor**

```bash
grep -r "getAvatarColor" src/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Update all consumers to use getAvatarStyle from tokens.ts instead**

For each file that imports `getAvatarColor` from utils, change to:
```typescript
import { getAvatarStyle } from '@/lib/tokens';
// and replace getAvatarColor() calls with getAvatarStyle()
```

- [ ] **Step 3: Remove getAvatarColor from utils.ts**

```typescript
// src/lib/utils.ts
// REMOVE getAvatarColor function
// KEEP: cn(), formatIDR(), isValidEmail(), getInitials()
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts
git commit -m "refactor(design): remove duplicate getAvatarColor, use getAvatarStyle from tokens

Consolidate avatar color logic in tokens.ts. getAvatarStyle was already
the source of truth - getAvatarColor was a duplicate with slightly different
implementation."
```

---

## Task 6: Layer 3 — Component — EmptyState Animations

**File:** `src/components/shared/EmptyState.tsx`

- [ ] **Step 1: Add subtle icon bounce and staggered text reveal**

```tsx
// REPLACE the component with enhanced version:

export function EmptyState({ title, description, actionLabel, onAction, icon, variant = 'default', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl py-14 text-center animate-fade-in-up',
        className,
      )}
      style={{ border: '1px dashed var(--border-default)', background: 'var(--surface-raised)' }}
    >
      <div
        className="mb-5 text-[var(--text-tertiary)]"
        style={{ opacity: 0.4 }}
      >
        {/* Wrap icon with bounce animation */}
        <div className="animate-bounce" style={{ animationDuration: '3s' }}>
          {icon || VARIANT_ICONS[variant]}
        </div>
      </div>
      <h3
        className="mb-1.5 text-base font-semibold tracking-tight text-[var(--text-primary)]"
        style={{ animationDelay: '100ms' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="mb-6 max-w-xs text-sm leading-relaxed text-[var(--text-tertiary)]"
          style={{ animationDelay: '200ms' }}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2"
          style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            border: '1px solid var(--primary)',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/EmptyState.tsx
git commit -m "feat(design): add subtle animations to EmptyState

- Add animate-fade-in-up to container for entrance animation
- Add icon bounce animation (3s duration, subtle)
- Stagger title and description with animation-delay
- Update button to use primary-light/primary tokens instead of accent-muted"
```

---

## Task 7: Layer 1 — Dashboard Page — Remove All Hardcoded Colors

**File:** `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace PROJECT_STATUS_COLORS and INVOICE_STATUS_COLORS hardcoded objects**

Remove lines ~34-46 with hardcoded `oklch(...)` values:
```typescript
// REMOVE:
const PROJECT_STATUS_COLORS: Record<string, string> = {
  backlog: 'oklch(0.55 0.1 250)',
  in_progress: 'oklch(0.65 0.12 220)',
  review: 'oklch(0.75 0.12 80)',
  done: 'oklch(0.65 0.12 140)',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  draft: 'oklch(0.55 0 0)',
  sent: 'oklch(0.65 0.12 220)',
  paid: 'oklch(0.65 0.12 140)',
  overdue: 'oklch(0.65 0.2 25)',
};
```

Add imports for StatusBadge and status configs:
```typescript
import { StatusBadge } from '@/components/ui/status-badge';
import {
  PROJECT_STATUS_CONFIG,
  PROJECT_STATUS_LABELS,
  INVOICE_STATUS_CONFIG,
  INVOICE_STATUS_LABELS,
} from '@/lib/tokens';
```

- [ ] **Step 2: Replace all inline style prop colors with CSS variables**

Replace every `style={{ background: 'oklch(...)', borderColor: 'oklch(...)' }}` with CSS variables:

```tsx
// REPLACE skeleton loading backgrounds:
// OLD: style={{ background: 'oklch(0.16 0.015 265)', ... }}
// NEW: style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-default)' }}

// REPLACE loading skeleton header:
// OLD: style={{ background: 'rgb(255 255 255 / 5%)', borderRadius: '8px' }}
// NEW: style={{ background: 'var(--surface-hover)', borderRadius: 'var(--radius)' }}

// REPLACE heading colors:
// OLD: style={{ color: 'oklch(0.97 0 0)' }}
// NEW: className="text-[var(--text-primary)]" or style={{ color: 'var(--text-primary)' }}

// REPLACE secondary text:
// OLD: style={{ color: 'rgb(255 255 255 / 35%)' }}
// NEW: style={{ color: 'var(--text-secondary)' }}

// REPLACE card backgrounds:
// OLD: style={{ background: 'oklch(0.16 0.015 265)', borderColor: 'rgb(255 255 255 / 6%)' }}
// NEW: style={{ background: 'var(--surface-raised)', borderColor: 'var(--border-default)' }}

// REPLACE border dividers:
// OLD: style={{ borderBottom: '1px solid rgb(255 255 255 / 5%)' }}
// NEW: style={{ borderBottom: '1px solid var(--border-subtle)' }}

// REPLACE section headings:
// OLD: style={{ color: 'oklch(0.97 0 0)' }} (h2 elements)
// NEW: className="font-heading text-[var(--text-primary)]"

// REPLACE muted text:
// OLD: style={{ color: 'rgb(255 255 255 / 30%)' }}
// NEW: style={{ color: 'var(--text-tertiary)' }}

// REPLACE tertiary text:
// OLD: style={{ color: 'rgb(255 255 255 / 25%)' }}
// NEW: style={{ color: 'var(--text-tertiary)' }}

// REPLACE "View all" links:
// OLD: style={{ color: 'oklch(0.82 0.12 75)' }}
// NEW: style={{ color: 'var(--primary)' }}

// REPLACE action button backgrounds:
// OLD: style={{ background: 'oklch(0.82 0.12 75 / 10%)', ... }}
// NEW: style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary-muted)' }}

// REPLACE status badge colors (via PROJECT_STATUS_COLORS inline):
// OLD: <Badge style={{ background: PROJECT_STATUS_COLORS[project.status] + '18', ... }}>
// NEW: <StatusBadge config={PROJECT_STATUS_CONFIG} status={project.status} label={PROJECT_STATUS_LABELS[project.status]} />
```

- [ ] **Step 3: Add staggered entrance animation to list items**

```tsx
// Wrap project/invoice list items with data-animate attribute:
// MAP over items with:
{recentProjects.map((project, i) => (
  <Link
    key={project.id}
    href={`/dashboard/projects/${project.id}`}
    data-animate
    ...
  />
))}

// Wrap both lists with animate-fade-in-up class
```

- [ ] **Step 4: Update heading typography**

Replace the hardcoded heading styles with proper typography classes:
```tsx
// REPLACE:
// OLD: className="mb-1 text-2xl font-bold tracking-tight"
// NEW: className="mb-1 text-h2 font-heading"

// Use .font-heading and .text-h2 for dashboard headings
```

- [ ] **Step 5: Verify no hardcoded colors remain**

```bash
grep -n "oklch(0" src/app/dashboard/page.tsx
grep -n "rgb(255 255 255" src/app/dashboard/page.tsx
```

Both should return empty.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "refactor(design): overhaul dashboard page with design tokens and StatusBadge

- Remove all hardcoded oklch() and rgb() inline styles
- Replace PROJECT_STATUS_COLORS with StatusBadge component
- Replace INVOICE_STATUS_COLORS with StatusBadge component
- Update all colors to use CSS variables (surface-raised, border-default, text-primary, etc.)
- Add .font-heading and .text-h2 typography classes
- Add staggered entrance animation with data-animate
- Update button styles to use primary-light/primary tokens"
```

---

## Task 8: Layer 3 — StatusBadge Migration — Projects, Clients, Finance Pages

**Files:** All pages under `src/app/dashboard/projects/`, `src/app/dashboard/clients/`, `src/app/dashboard/finance/`

- [ ] **Step 1: Find all pages with status badges**

```bash
grep -rln "PROJECT_STATUS_COLORS\|INVOICE_STATUS_COLORS\|<Badge.*status" src/app/dashboard/
```

- [ ] **Step 2: For each file, replace inline status badge styles with StatusBadge**

Common pattern to replace:
```tsx
// BEFORE:
<Badge
  variant="outline"
  className="text-[10px] font-medium shrink-0"
  style={{
    background: PROJECT_STATUS_COLORS[project.status] + '18',
    color: PROJECT_STATUS_COLORS[project.status],
    borderColor: PROJECT_STATUS_COLORS[project.status] + '30',
  }}
>
  {STATUS_LABELS[project.status] ?? project.status}
</Badge>

// AFTER:
<StatusBadge
  config={PROJECT_STATUS_CONFIG}
  status={project.status}
  label={PROJECT_STATUS_LABELS[project.status]}
  size="sm"
  className="shrink-0"
/>
```

- [ ] **Step 3: Remove duplicate status color constants from each page**

Remove any local `STATUS_COLORS`, `STATUS_LABELS` objects that duplicate the `tokens.ts` exports.

- [ ] **Step 4: Add import for StatusBadge and token configs**

```typescript
import { StatusBadge } from '@/components/ui/status-badge';
import { PROJECT_STATUS_CONFIG, PROJECT_STATUS_LABELS, ... } from '@/lib/tokens';
```

- [ ] **Step 5: Verify all pages still build**

```bash
npm run build 2>&1 | tail -30
```

Expected: Build completes without TypeScript errors or import failures.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/projects/ src/app/dashboard/clients/ src/app/dashboard/finance/
git commit -m "refactor(design): migrate projects, clients, finance to StatusBadge

Replace all inline status badge styling with StatusBadge component.
Remove duplicate STATUS_COLORS constants from each page.
All status badges now use single source of truth from tokens.ts."
```

---

## Task 9: Verify — Full Token Audit

**Goal:** Confirm zero hardcoded colors remain in the UI.

- [ ] **Step 1: Search for remaining hardcoded colors**

```bash
# Should return no .tsx/.ts files with inline color values
grep -rn "oklch(0" src/ --include="*.tsx" --include="*.ts"
grep -rn "rgb(255" src/ --include="*.tsx" --include="*.ts"
grep -rn "rgb(0" src/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Verify StatusBadge usage**

```bash
grep -rn "StatusBadge" src/ --include="*.tsx"
```

Expected: StatusBadge used across dashboard, projects, clients, finance pages.

- [ ] **Step 3: Verify typography classes**

```bash
grep -rn "font-heading\|\.text-h[1-3]\|\.text-display" src/ --include="*.tsx" | head -20
```

- [ ] **Step 4: Full build test**

```bash
npm run build
```

Expected: Build passes. Check for any TypeScript errors related to the changes.

- [ ] **Step 5: Commit verification**

```bash
git add -A
git commit -m "chore(design): verify no hardcoded colors remain, all StatusBadge migrated"
```

---

## Task 10: Final Review — Visual Check

- [ ] **Step 1: Start dev server and check light mode**

```bash
npm run dev
# Visit http://localhost:3000/dashboard
# Verify: blue primary buttons, card-based layout, clean surfaces
```

- [ ] **Step 2: Check dark mode**

```bash
# Toggle dark mode or check if .dark class is applied
# Verify: blue primary persists, surfaces use dark tokens
```

- [ ] **Step 3: Check motion animations**

```bash
# Reload dashboard page
# Verify: staggered fade-in on project/invoice lists
# Verify: skeleton shimmer on loading states
# Verify: page entrance animation
```

- [ ] **Step 4: Check all status badges**

```bash
# Navigate: Projects, Clients, Finance pages
# Verify: StatusBadge displays with correct colors from tokens
```

---

## Dependencies

```
Task 1 (globals.css tokens)
  ↓
Task 2 (layout.tsx font)        ← depends on Task 1
  ↓
Task 3 (StatusBadge)            ← depends on Task 1
  ↓
Task 4 (Card, Skeleton)         ← depends on Task 1
  ↓
Task 5 (Utils cleanup)          ← independent
Task 6 (EmptyState)             ← depends on Task 1
  ↓
Task 7 (Dashboard page)         ← depends on Tasks 1, 3, 6
  ↓
Task 8 (Other pages)            ← depends on Tasks 1, 3
  ↓
Task 9 (Verification)           ← depends on all above
Task 10 (Visual check)          ← depends on all above
```

---

## Summary

| # | Task | Files | Key Changes |
|---|------|-------|-------------|
| 1 | Design Tokens | `globals.css` | Blue primary, surface system, motion tokens, animations |
| 2 | Typography Font | `layout.tsx` | Plus Jakarta Sans as heading font |
| 3 | StatusBadge | `status-badge.tsx` | New unified status badge component |
| 4 | Card & Skeleton | `card.tsx`, `skeleton.tsx` | Semantic surfaces, gradient pulse skeleton |
| 5 | Utils Cleanup | `utils.ts` | Remove duplicate getAvatarColor |
| 6 | EmptyState | `EmptyState.tsx` | Subtle bounce + staggered reveal |
| 7 | Dashboard Page | `dashboard/page.tsx` | Remove all hardcoded colors, use StatusBadge + tokens |
| 8 | Other Pages | `projects/**`, `clients/**`, `finance/**` | Migrate to StatusBadge |
| 9 | Verification | all | Token audit, build test |
| 10 | Visual Check | all | Manual verification |