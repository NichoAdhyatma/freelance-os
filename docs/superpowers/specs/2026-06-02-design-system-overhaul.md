# Design System Overhaul — Freelancer OS

**Date:** 2026-06-02
**Author:** adaCODE AI
**Status:** Approved

---

## 1. Overview

A full design system overhaul across 4 layers, applying a **Professional SaaS** aesthetic with a **Primary Action Blue** color system, **light mode first**, and **Rich & Polished** motion throughout. All changes follow a bottom-up approach: foundations first (tokens, typography), then visible components, then polish (motion).

---

## 2. Design Direction

| Dimension | Choice |
|-----------|--------|
| Visual Style | Clean & modern, light mode white & blue |
| Feel | Professional SaaS — structured, card-based, data-dense |
| Primary Color | Blue as action color — buttons, links, active states, badges |
| Motion | Rich & Polished — spring physics, skeleton loading, entrance animations |
| Approach | Bottom-up — components visible first, foundations under the hood |

---

## 3. Layer 1 — Design Tokens & CSS Variables

### 3.1 Primary Blue Token System

Replace the current neutral-gray `--primary` with a blue system.

```css
/* globals.css — :root section */
--primary:        oklch(0.55 0.16 235);   /* buttons, links, active states */
--primary-hover:  oklch(0.50 0.17 235);  /* darker on hover */
--primary-light:  oklch(0.55 0.16 235 / 10%); /* subtle backgrounds */
--primary-muted:  oklch(0.55 0.16 235 / 15%); /* badge backgrounds */
--primary-foreground: oklch(1 0 0);         /* white text on primary */
```

### 3.2 Surface System Refinements

Professional SaaS card-based elevation system.

```css
/* globals.css — :root section */
--surface-base:    oklch(1 0 0);         /* white — base background */
--surface-raised:  oklch(0.985 0 0);    /* cards, panels */
--surface-overlay: oklch(1 0 0);         /* dialog, modal */
--surface-hover:   oklch(0.98 0 0);     /* hover state */
--surface-active:   oklch(0.975 0 0);    /* pressed state */

/* Border hierarchy */
--border-subtle:  oklch(0.94 0 0);   /* dividers, table lines */
--border-default: oklch(0.90 0 0);   /* card borders, inputs */
--border-strong:  oklch(0.82 0 0);   /* emphasis */

/* Text hierarchy */
--text-primary:    oklch(0.15 0 0);    /* headings, important text */
--text-secondary:  oklch(0.40 0 0);    /* body text, labels */
--text-tertiary:   oklch(0.55 0 0);    /* captions, metadata */
--text-disabled:   oklch(0.70 0 0);    /* disabled states */
```

### 3.3 Dark Mode Overrides

```css
/* globals.css — .dark section */
--primary:        oklch(0.62 0.16 235);
--primary-hover:  oklch(0.55 0.17 235);
--primary-light:  oklch(0.62 0.16 235 / 10%);
--primary-muted:  oklch(0.62 0.16 235 / 15%);
--primary-foreground: oklch(0.12 0.015 265);

--surface-base:    oklch(0.11 0.015 265);
--surface-raised:  oklch(0.16 0.015 265);
--surface-overlay: oklch(0.20 0.015 265);
--surface-hover:   oklch(0.22 0.015 265);
--surface-active:   oklch(0.26 0.015 265);

--border-subtle:  oklch(1 0 0 / 5%);
--border-default: oklch(1 0 0 / 10%);
--border-strong:  oklch(1 0 0 / 18%);

--text-primary:    oklch(0.97 0 0);
--text-secondary:  oklch(0.65 0 0);
--text-tertiary:   oklch(0.40 0 0);
--text-disabled:   oklch(0.30 0 0);
```

### 3.4 Remove All Hardcoded Colors

**Scope:** Replace every `oklch(...)` raw value in inline `style` props across:
- `src/app/dashboard/page.tsx` — replace all `oklch(...)` and `rgb(...)` with CSS vars
- `src/components/shared/Sidebar.tsx` — verify token usage
- Any other file with hardcoded color values

**Principle:** Every color in the UI comes from a CSS variable. Zero hardcoded oklch values in components.

---

## 4. Layer 2 — Typography & Visual Hierarchy

### 4.1 Font Loading

**File:** `src/app/layout.tsx`

```typescript
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

Apply in `html` className: `${inter.variable} ${jetbrainsMono.variable} ${plusJakarta.variable} dark h-full antialiased`

### 4.2 Typography Scale

**File:** `globals.css`

```css
@theme inline {
  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-heading: var(--font-heading);
}
```

Add heading utility classes:

```css
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
```

### 4.3 Semantic Text Utilities

```css
.text-heading   { color: var(--text-primary); }
.text-body      { color: var(--text-secondary); }
.text-caption   { color: var(--text-tertiary); }
.text-disabled  { color: var(--text-disabled); }
```

### 4.4 Scope

Update heading elements across:
- `src/app/dashboard/page.tsx`
- `src/app/(auth)/**` pages
- `src/app/dashboard/projects/**` pages
- `src/app/dashboard/clients/**` pages
- `src/app/dashboard/finance/**` pages

---

## 5. Layer 3 — Component Consistency

### 5.1 StatusBadge Component

**New file:** `src/components/ui/status-badge.tsx`

```typescript
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

**Replace all status badge usages across the app:**
- `src/app/dashboard/page.tsx` — replace `PROJECT_STATUS_COLORS` and `INVOICE_STATUS_COLORS` inline styles with `<StatusBadge>`
- Project list cards
- Client list
- Invoice table
- Anywhere `PRIORITY_CONFIG`, `PROJECT_STATUS_CONFIG`, `INVOICE_STATUS_CONFIG` is used inline

### 5.2 Avatar Color Centralization

**File:** `src/lib/utils.ts`

- Remove `getAvatarColor()` — duplicate of `getAvatarStyle()` in `tokens.ts`
- Keep `getInitials()` and `formatIDR()`
- Update all consumers of `getAvatarColor()` to import from `tokens.ts` instead

**Update:** `src/lib/tokens.ts` — export `getAvatarStyle` (it already exists but may not be exported).

### 5.3 Card Component Update

**File:** `src/components/ui/card.tsx`

Update default className to use semantic tokens:
```tsx
const cardContentVariants = cva(
  'flex flex-col gap-4 rounded-xl border border-border-default bg-surface-raised p-6 text-sm',
  // ...
);
```

### 5.4 Button Variants — Primary Blue

**File:** `src/components/ui/button.tsx`

Add/update primary variant to use blue tokens:
```tsx
// Ensure "default" variant maps to blue primary
// variant: 'default' → bg-primary text-primary-foreground hover:bg-primary-hover
```

### 5.5 Shared Sidebar Token Audit

**File:** `src/components/shared/Sidebar.tsx`

Audit and replace any remaining hardcoded `oklch(...)` or `rgb(...)` with CSS variables.

---

## 6. Layer 4 — Motion & Animation

### 6.1 Motion Token System

**File:** `globals.css`

```css
/* Easing curves */
--ease-spring:  cubic-bezier(0.34, 1.56, 0.64, 1);  /* overshoot — buttons */
--ease-smooth:  cubic-bezier(0.4, 0, 0.2, 1);         /* panels, overlays */
--ease-out:     cubic-bezier(0, 0, 0.2, 1);          /* entrance */
--ease-in:      cubic-bezier(0.4, 0, 1, 1);          /* exit */

/* Duration scale */
--duration-instant: 50ms;
--duration-fast:    100ms;
--duration-base:    150ms;
--duration-slow:    250ms;
--duration-slower:  350ms;
--duration-slowest: 500ms;

/* Utility classes */
.transition-spring {
  transition-timing-function: var(--ease-spring);
}
.transition-smooth {
  transition-timing-function: var(--ease-smooth);
}
```

### 6.2 Entrance Animations

**File:** `globals.css`

```css
/* Staggered fade-in-up for lists and cards */
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

.animate-fade-in-up {
  animation: fadeInUp var(--duration-slow) var(--ease-out) both;
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

### 6.3 Page Transitions

**File:** `globals.css`

```css
@keyframes pageIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pageOut {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-4px); }
}

.page-enter {
  animation: pageIn var(--duration-slower) var(--ease-out) both;
}
```

Apply `page-enter` to main content wrapper in dashboard layout.

### 6.4 Micro-interactions

**Button press:**
```tsx
// button.tsx — add to default classes
'active:scale-[0.97] transition-all duration-100'
```

**Card hover elevation:**
```tsx
// card.tsx or via global class
'hover:shadow-md hover:-translate-y-px transition-all duration-150 ease-smooth'
```

**Table row hover:**
```tsx
// table rows — add
'hover:bg-surface-hover transition-colors duration-100'
```

### 6.5 Skeleton Enhancements

**File:** `src/components/ui/skeleton.tsx`

Already exists. Add subtle pulse animation variant:
```tsx
const skeletonPulse = 'animate-pulse bg-gradient-to-r from-transparent via-black/5 to-transparent bg-[length:200%_100%]';
```

Apply skeleton loading to:
- Dashboard stats section (replace current loading state)
- Project list page
- Client list page
- Invoice list page

### 6.6 Animated Empty States

**File:** `src/components/shared/EmptyState.tsx`

Enhance existing component:
- Subtle icon bounce animation
- Staggered text reveal

---

## 7. Files to Modify

| File | Changes |
|------|---------|
| `src/app/globals.css` | Primary blue tokens, surface system, text hierarchy, motion tokens, entrance animations, page transitions |
| `src/app/layout.tsx` | Add Plus Jakarta Sans heading font |
| `src/components/ui/status-badge.tsx` | **NEW** — unified status badge component |
| `src/components/ui/badge.tsx` | May need minor update for outline variant |
| `src/components/ui/card.tsx` | Update to use semantic surface tokens |
| `src/components/ui/button.tsx` | Ensure primary variant uses blue tokens |
| `src/components/ui/skeleton.tsx` | Enhance with gradient pulse variant |
| `src/components/shared/Sidebar.tsx` | Audit & remove hardcoded colors |
| `src/components/shared/EmptyState.tsx` | Add subtle animations |
| `src/app/dashboard/page.tsx` | Remove all hardcoded oklch, use StatusBadge, use semantic tokens |
| `src/lib/tokens.ts` | Export `getAvatarStyle`, ensure clean exports |
| `src/lib/utils.ts` | Remove `getAvatarColor()` duplicate |
| `src/app/dashboard/projects/**` | Use StatusBadge, update headings |
| `src/app/dashboard/clients/**` | Use StatusBadge, update headings |
| `src/app/dashboard/finance/**` | Use StatusBadge, update headings |

---

## 8. Verification

1. **Token check:** Search entire `src/` for `oklch(0` and `rgb(` — no inline color values should remain in JSX/TSX files
2. **StatusBadge:** All status badges across dashboard, projects, clients, finance pages use `<StatusBadge>`
3. **Typography:** All headings use `.font-heading` class or heading type scale
4. **Motion:** Dashboard shows staggered entrance, skeleton loading on all list pages
5. **Light mode:** All colors use CSS variables — no flash of wrong color on theme switch
6. **Build passes:** `npm run build` completes without errors
