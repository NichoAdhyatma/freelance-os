# Project → Invoice Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add invoice dropdown to `ProjectForm` and `ProjectRow` (table inline edit), with "used in other project" badge indicator and quick-add invoice sheet.

**Architecture:** Two-phase approach: (1) add `invoiceId` to Project type + service, (2) add dropdown UI in both components using existing `PopoverPrimitive` pattern (same as client dropdown already in `ProjectRow`), with `QuickAddInvoiceSheet` for inline creation.

**Tech Stack:** React, TypeScript, `@base-ui/react/popover` (ProjectRow), `shadcn/ui Popover+Command` (ProjectForm), Firestore.

---

## Task 1: Add `invoiceId` to Project Types

**Files:**
- Modify: `src/types/project.ts`

- [ ] **Step 1: Add `invoiceId` to `Project` and `ProjectFormData` interfaces**

Open `src/types/project.ts` and add `invoiceId?: string` field to both `Project` and `ProjectFormData`:

```typescript
export interface Project {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  invoiceId?: string; // ← new
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  deadline?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProjectFormData {
  title: string;
  description?: string;
  clientId?: string;
  invoiceId?: string; // ← new
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline?: Date;
  progress?: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/project.ts
git commit -m "feat(projects): add invoiceId field to Project type"
```

---

## Task 2: Update projectService to handle invoiceId

**Files:**
- Modify: `src/lib/services/projectService.ts`

- [ ] **Step 1: Add `invoiceId` to `createProject`**

In `createProject()`, add after `budget`:

```typescript
await setDoc(ref, {
  // ... existing fields ...
  budget: data.budget || null,
  invoiceId: data.invoiceId || null,  // ← new
  createdAt: now,
  updatedAt: now,
});
```

- [ ] **Step 2: Add `invoiceId` to `updateProject`**

In `updateProject()` after the `clientId` line:

```typescript
if ('clientId' in data) updates.clientId = data.clientId || null;
if ('invoiceId' in data) updates.invoiceId = data.invoiceId || null; // ← new
if (data.status !== undefined) updates.status = data.status;
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/services/projectService.ts
git commit -m "feat(projects): handle invoiceId in create/update service"
```

---

## Task 3: Create QuickAddInvoiceSheet component

**Files:**
- Create: `src/components/invoices/QuickAddInvoiceSheet.tsx`

- [ ] **Step 1: Create the component**

Use `QuickAddClientSheet.tsx` as reference. Key differences:
- Fields: client selector (pre-filled if `initialClientId` provided), amount, due date
- `onCreated(invoiceId: string)` callback
- Uses `useInvoices().add()` from `useInvoices` hook
- Pre-fills `clientId` from `initialClientId` prop
- `projectId` is NOT part of the form — the project that calls this sheet will update its own `invoiceId` after creation

```tsx
'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useInvoices } from '@/hooks/useInvoices';

interface QuickAddInvoiceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (invoiceId: string) => void;
  initialClientId?: string;
}

export function QuickAddInvoiceSheet({ open, onOpenChange, onCreated, initialClientId }: QuickAddInvoiceSheetProps) {
  const { add } = useInvoices();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));

  // Pre-fill client when sheet opens
  useEffect(() => {
    if (open && initialClientId) {
      setClientId(initialClientId);
    }
  }, [open, initialClientId]);

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setClientId(initialClientId ?? '');
      setAmount('');
      setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000));
      setErrors({});
    }
    onOpenChange(val);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!clientId.trim()) newErrors.clientId = 'Client is required';
    if (!amount || isNaN(Number(amount))) newErrors.amount = 'Valid amount is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { id } = await add({
        clientId: clientId.trim(),
        amount: Number(amount),
        dueDate,
      });
      toast.success('Invoice created — linked to project');
      onCreated(id);
      handleOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Add New Invoice</SheetTitle>
          <SheetDescription>Quickly add an invoice while creating your project.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-4">
          {/* Client */}
          <div className="space-y-1.5">
            <label htmlFor="quick-invoice-client" className="text-sm font-medium">
              Client <span className="text-destructive">*</span>
            </label>
            <Input
              id="quick-invoice-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID or name"
              className={errors.clientId ? 'border-destructive' : ''}
              autoFocus
            />
            {errors.clientId && <p className="text-destructive text-xs">{errors.clientId}</p>}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label htmlFor="quick-invoice-amount" className="text-sm font-medium">
              Amount (IDR) <span className="text-destructive">*</span>
            </label>
            <Input
              id="quick-invoice-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000000"
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && <p className="text-destructive text-xs">{errors.amount}</p>}
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <label htmlFor="quick-invoice-due" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              id="quick-invoice-due"
              type="date"
              value={dueDate.toISOString().split('T')[0]}
              onChange={(e) => setDueDate(new Date(e.target.value + 'T00:00:00'))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Add Invoice'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/invoices/QuickAddInvoiceSheet.tsx
git commit -m "feat(invoices): add QuickAddInvoiceSheet component"
```

---

## Task 4: Add Invoice dropdown to ProjectForm

**Files:**
- Modify: `src/components/projects/ProjectForm.tsx`

- [ ] **Step 1: Add imports for Badge and QuickAddInvoiceSheet, add useProjects hook**

Add after the existing imports:
```tsx
import { Badge } from '@/components/ui/badge';
import { QuickAddInvoiceSheet } from '@/components/invoices/QuickAddInvoiceSheet';
import { useProjects } from '@/hooks/useProjects';
```

Also import `FileText` from lucide-react:
```tsx
import { CalendarIcon, Check, ChevronDown, FileText, Plus, User } from 'lucide-react';
```

- [ ] **Step 2: Add invoice state and quick-add sheet state after existing state declarations**

In the component body (after `const [quickAddOpen, setQuickAddOpen] = useState(false);`):
```tsx
const [invoiceId, setInvoiceId] = useState('');
const [invoicePopoverOpen, setInvoicePopoverOpen] = useState(false);
const [quickAddInvoiceOpen, setQuickAddInvoiceOpen] = useState(false);
const { projects } = useProjects();
```

- [ ] **Step 3: Add invoice reset in useEffect when form opens/initialData changes**

In the `useEffect` that resets the form, add:
```tsx
setInvoiceId(initialData?.invoiceId ?? '');
```

And in the `else` (new project):
```tsx
setInvoiceId('');
```

- [ ] **Step 4: Add invoice dropdown UI — insert after the Client section (before Status & Priority)**

In the form, after the Client popover section and before the closing `</div>` of the Client div:

```tsx
{/* Invoice */}
<div className="space-y-1.5">
  <div className="flex items-center justify-between">
    <Label>Invoice</Label>
    <Button
      variant="ghost"
      size="sm"
      className="h-6 text-xs"
      onClick={() => setQuickAddInvoiceOpen(true)}
    >
      <Plus className="mr-1 h-3 w-3" />
      Add New
    </Button>
  </div>
  <Popover open={invoicePopoverOpen} onOpenChange={setInvoicePopoverOpen}>
    <PopoverTrigger>
      <div
        role="combobox"
        className={cn(
          'flex h-10 w-full items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors',
          !invoiceId && 'text-muted-foreground',
        )}
      >
        <FileText className="mr-2 h-4 w-4 shrink-0" />
        {invoiceId
          ? (() => {
              const inv = invoices.find((i) => i.id === invoiceId);
              return inv ? `${inv.invoiceNumber} · Rp ${inv.amount.toLocaleString('id-ID')}` : 'Select invoice';
            })()
          : 'No invoice (optional)'}
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
      </div>
    </PopoverTrigger>
    <PopoverContent className="w-[360px] p-0" align="start">
      <Command>
        <CommandInput placeholder="Search invoices..." autoFocus />
        <CommandList>
          <CommandEmpty>
            {invoices.length === 0 ? 'No invoices yet.' : 'No invoice found.'}
          </CommandEmpty>
          <CommandGroup>
            {invoices.map((inv) => {
              const usedByProject = inv.projectId ? projects.find((p) => p.id === inv.projectId) : null;
              const isUsedByOther = usedByProject && usedByProject.id !== initialData?.id;
              return (
                <CommandItem
                  key={inv.id}
                  value={inv.id}
                  onSelect={() => {
                    setInvoiceId(inv.id);
                    setInvoicePopoverOpen(false);
                  }}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <div className="flex w-full items-center gap-2">
                    <Check
                      className={cn(
                        'h-4 w-4 shrink-0',
                        invoiceId === inv.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <span className="truncate text-sm font-medium">{inv.invoiceNumber}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Rp {inv.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  {isUsedByOther && (
                    <div className="ml-6">
                      <Badge variant="secondary" className="text-xs">
                        Used in {usedByProject.title}
                      </Badge>
                    </div>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</div>
```

- [ ] **Step 5: Add `useInvoices` hook to component and pass to template**

Add at the top of the component:
```tsx
const { invoices } = useInvoices();
```

Pass `invoiceId` in handleSubmit:
```tsx
await onSubmit({
  title: title.trim(),
  description: description.trim() || undefined,
  clientId: clientId || undefined,
  invoiceId: invoiceId || undefined,  // ← new
  status,
  priority,
  deadline,
});
```

- [ ] **Step 6: Add QuickAddInvoiceSheet at bottom of form**

Add before the closing `</form>`:
```tsx
<QuickAddInvoiceSheet
  open={quickAddInvoiceOpen}
  onOpenChange={setQuickAddInvoiceOpen}
  onCreated={(newInvoiceId) => {
    setInvoiceId(newInvoiceId);
    setInvoicePopoverOpen(false);
  }}
  initialClientId={clientId || undefined}
/>
```

- [ ] **Step 7: Commit**

```bash
git add src/components/projects/ProjectForm.tsx
git commit -m "feat(projects): add invoice dropdown to ProjectForm"
```

---

## Task 5: Add Invoice inline dropdown to ProjectRow

**Files:**
- Modify: `src/components/projects/ProjectRow.tsx`

- [ ] **Step 1: Add imports**

Add to the existing imports:
```tsx
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
```

- [ ] **Step 2: Add invoice cell state in ProjectRow component**

In `ProjectRow` function, after `const [editDeadline, setEditDeadline] = useState...`:
```tsx
const [editInvoice, setEditInvoice] = useState(project.invoiceId ?? '');
```

Also update the `origRef`:
```tsx
const origRef = useRef({
  // ... existing fields ...
  invoiceId: project.invoiceId ?? '',
});
```

And update the `revertCell` function:
```tsx
if (key === 'invoice') setEditInvoice(origRef.current.invoiceId);
```

Update the `saveCell` function to handle `invoice` key:
```tsx
if (key === 'invoice') data.invoiceId = (overrideValue?.invoiceId ?? editInvoice) || undefined;
```

- [ ] **Step 3: Add Invoice cell between Deadline and Actions columns**

Find the table row and add the invoice cell. In `ProjectRow`, the columns are:
1. Index (w-8)
2. Title (w-fit)
3. Client (w-fit)
4. Priority (w-fit)
5. Progress
6. Deadline
7. **NEW: Invoice** ← here
8. Actions

Add after `<TableCell className="border-r border-border py-3 pr-2"><DeadlineCell /></TableCell>`:

```tsx
<TableCell className="border-r border-border py-3 pr-2">
  <InvoiceCell />
</TableCell>
```

- [ ] **Step 4: Create the InvoiceCell component inside ProjectRow**

Add the `InvoiceCell` after `DeadlineCell` (before the `return` of `ProjectRow`):

```tsx
// ── Invoice ─────────────────────────────────────────────────────────────────
const InvoiceCell = () => {
  const { invoices } = useInvoices();
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);

  const displayInvoice = project.invoiceId
    ? invoices.find((i) => i.id === project.invoiceId)
    : null;

  const formatAmount = (amount: number) =>
    `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger
        className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        {displayInvoice ? (
          <>
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-[120px]">
              {displayInvoice.invoiceNumber}
            </span>
          </>
        ) : (
          <span>—</span>
        )}
        <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner align="start" sideOffset={4} className="z-50">
          <PopoverPrimitive.Popup className="flex w-80 flex-col gap-1 rounded-lg border bg-popover p-2 shadow-md">
            <div className="px-1 py-1.5 text-xs font-medium text-muted-foreground">Select Invoice</div>
            {invoices.length === 0 ? (
              <p className="px-2 py-2 text-xs text-muted-foreground">No invoices yet</p>
            ) : (
              <div className="max-h-56 overflow-y-auto">
                <button
                  className="flex w-full items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:bg-muted"
                  onClick={() => {
                    setEditInvoice('');
                    onSave({ invoiceId: undefined }).then(() => setOpen(false));
                  }}
                >
                  — No invoice —
                </button>
                {invoices.map((inv) => {
                  const usedBy = inv.projectId ? projects.find((p) => p.id === inv.projectId) : null;
                  const isUsedByOther = usedBy && usedBy.id !== project.id;
                  return (
                    <button
                      key={inv.id}
                      className="flex w-full flex-col items-start gap-0.5 px-2 py-2 text-sm hover:bg-muted"
                      onClick={() => {
                        setEditInvoice(inv.id);
                        onSave({ invoiceId: inv.id }).then(() => setOpen(false));
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate font-mono text-xs">{inv.invoiceNumber}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatAmount(inv.amount)}
                        </span>
                      </div>
                      {isUsedByOther && (
                        <Badge variant="secondary" className="ml-5 text-xs">
                          Used in {usedBy.title}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
```

- [ ] **Step 5: Update the context menu actions in ProjectRow**

In the `onContextMenu` handler of the table row, add a separator or keep it simple — the existing menu is fine, no change needed.

- [ ] **Step 6: Commit**

```bash
git add src/components/projects/ProjectRow.tsx
git commit -m "feat(projects): add invoice inline dropdown to ProjectRow"
```

---

## Task 6: Add invoiceId handling to useProjects hook

**Files:**
- Modify: `src/hooks/useProjects.ts`

- [ ] **Step 1: Add invoiceId to createProject and updateProject calls**

Check the `useProjects.ts` file and ensure that `createProject` and `updateProject` calls pass `invoiceId` when available. If the hook already forwards all `ProjectFormData` fields to the service, no change needed. But verify by reading the file — if the hook constructs a partial data object manually, add `invoiceId`.

Run: Read `src/hooks/useProjects.ts`

If the hook uses spread or passes full data to service — no change needed.
If it manually constructs data — add `invoiceId` to the relevant calls.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useProjects.ts
git commit -m "feat(hooks): pass invoiceId through useProjects hook"
```

---

## Spec Coverage Checklist

- [x] `Project.invoiceId` added to type → Task 1
- [x] Service handles `invoiceId` in create/update → Task 2
- [x] `QuickAddInvoiceSheet` component → Task 3
- [x] Invoice dropdown in `ProjectForm` (Popover+Command, filtered, "used in" badge) → Task 4
- [x] Invoice inline dropdown in `ProjectRow` (PopoverPrimitive, same indicator pattern) → Task 5
- [x] Hook passes `invoiceId` through → Task 6
- [x] Invoice filtering by clientId → handled in UI (show all, "used in other project" badge per invoice)

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-18-project-invoice-dropdown-plan.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?