# Inline Row Editing — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Replace popup Dialog forms with inline editable rows in the table — similar to Notion/Spreadsheet. User clicks "Add" → new editable row appears at the top of the table. Click edit icon → row becomes editable inline. No dialog popup for quick operations.

**Architecture:** Create a reusable `InlineEditRow` component that wraps an entire table row with edit mode state. When in edit mode, cells become inputs. "Add" button inserts this row at the top of the table. "Edit" action converts existing row to edit mode. Save/Cancel buttons inline.

**Tech Stack:** React 19, TypeScript, shadcn/ui Input/Select/Popover, existing hooks (useProjects, useClients, useInvoices), Firebase Firestore.

---

## File Map

| Action | File |
|--------|------|
| Create | `src/components/shared/InlineEditRow.tsx` — reusable inline edit row component |
| Create | `src/components/projects/ProjectInlineRow.tsx` — project-specific inline row |
| Create | `src/components/clients/ClientInlineRow.tsx` — client-specific inline row |
| Create | `src/components/invoices/InvoiceInlineRow.tsx` — invoice-specific inline row |
| Modify | `src/app/dashboard/projects/page.tsx` — remove ProjectForm dialog, use ProjectInlineRow |
| Modify | `src/app/dashboard/clients/page.tsx` — remove ClientForm dialog, use ClientInlineRow |
| Modify | `src/app/dashboard/finance/page.tsx` — remove InvoiceForm dialog, use InvoiceInlineRow |

---

## Task 1: Create InlineEditRow Component

**Files:**
- Create: `src/components/shared/InlineEditRow.tsx`

A reusable wrapper component that handles edit/new row state.

```tsx
'use client';

import { cn } from '@/lib/utils';

interface InlineEditRowProps {
  /** True when this row is in edit/add mode */
  isEditing: boolean;
  /** Optional: pass children to render when in edit mode */
  children: React.ReactNode;
  /** Optional: render a display row when not editing */
  displayRow?: React.ReactNode;
  className?: string;
}

export function InlineEditRow({ isEditing, children, className }: InlineEditRowProps) {
  return (
    <tr
      className={cn(
        'border-border transition-colors',
        isEditing
          ? 'bg-muted/50 border-t border-b'
          : 'hover:bg-accent/50 border-b',
        className,
      )}
    >
      {children}
    </tr>
  );
}
```

This is a simple wrapper — the complexity lives in each entity's InlineRow component.

---

## Task 2: Create ProjectInlineRow Component

**Files:**
- Create: `src/components/projects/ProjectInlineRow.tsx`

An inline row component for adding/editing projects directly in the table.

```tsx
'use client';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Check, Pencil, User, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { QuickAddClientSheet } from '@/components/clients/QuickAddClientSheet';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { cn } from '@/lib/utils';
import type { Project, ProjectFormData } from '@/types/project';

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface ProjectInlineRowProps {
  mode: 'add' | 'edit';
  initialData?: Project | null;
  onSave: (data: ProjectFormData) => Promise<void>;
  onCancel: () => void;
  clients: ReturnType<typeof useClients>['clients'];
}

export function ProjectInlineRow({
  mode,
  initialData,
  onSave,
  onCancel,
  clients,
}: ProjectInlineRowProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [clientId, setClientId] = useState(initialData?.clientId ?? '');
  const [status, setStatus] = useState(initialData?.status ?? 'backlog');
  const [priority, setPriority] = useState(initialData?.priority ?? 'medium');
  const [deadline, setDeadline] = useState<Date | undefined>(
    initialData?.deadline?.toDate(),
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        clientId: clientId || undefined,
        status,
        priority,
        deadline,
      });
      toast.success(mode === 'add' ? 'Project created' : 'Project updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-muted/30 border-border border-b">
      {/* # */}
      <td className="py-2 pl-4 pr-2">
        <span className="text-muted-foreground text-sm">+</span>
      </td>
      {/* Title */}
      <td className="py-2 pr-2">
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project name..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </td>
      {/* Client */}
      <td className="py-2 pr-2">
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="No client" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {/* Priority */}
      <td className="py-2 pr-2">
        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      {/* Budget */}
      <td className="py-2 pr-2">
        <Input
          type="number"
          placeholder="Budget"
          className="h-8 text-sm"
        />
      </td>
      {/* Progress */}
      <td className="py-2 pr-2">
        <span className="text-muted-foreground text-xs">—</span>
      </td>
      {/* Deadline */}
      <td className="py-2 pr-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground hover:bg-muted">
              <CalendarIcon className="h-3 w-3" />
              {deadline ? format(deadline, 'dd MMM') : 'Deadline'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={deadline}
              onSelect={(d) => d && setDeadline(d)}
              disabled={(d) => d < new Date('2020-01-01')}
            />
          </PopoverContent>
        </Popover>
      </td>
      {/* Actions */}
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave} disabled={saving}>
            <Check className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
```

---

## Task 3: Create ClientInlineRow Component

**Files:**
- Create: `src/components/clients/ClientInlineRow.tsx`

Simplified inline row for adding clients — only essential fields.

```tsx
'use client';

import { Check, Mail, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ClientFormData } from '@/types/client';

interface ClientInlineRowProps {
  mode: 'add' | 'edit';
  initialData?: { name?: string; email?: string } | null;
  onSave: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
}

export function ClientInlineRow({ mode, initialData, onSave, onCancel }: ClientInlineRowProps) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim() || undefined,
        company: company.trim() || undefined,
      });
      toast.success(mode === 'add' ? 'Client added' : 'Client updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-muted/30 border-border border-b">
      <td className="py-2 pl-4 pr-2"><span className="text-muted-foreground text-sm">+</span></td>
      <td className="py-2 pr-2">
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Client name..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </td>
      <td className="py-2 pr-2">
        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" className="h-8 text-sm" />
      </td>
      <td className="py-2 pr-2">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="h-8 text-sm" />
      </td>
      <td className="py-2 pr-2"><span className="text-muted-foreground text-xs">—</span></td>
      <td className="py-2 pr-2"><span className="text-muted-foreground text-xs">—</span></td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave} disabled={saving}>
            <Check className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
```

---

## Task 4: Create InvoiceInlineRow Component

**Files:**
- Create: `src/components/invoices/InvoiceInlineRow.tsx`

For invoices — inline row with client selector and amount input.

```tsx
'use client';

import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import type { InvoiceFormData } from '@/types/invoice';

interface InvoiceInlineRowProps {
  mode: 'add';
  onSave: (data: InvoiceFormData) => Promise<void>;
  onCancel: () => void;
}

export function InvoiceInlineRow({ mode, onSave, onCancel }: InvoiceInlineRowProps) {
  const { clients } = useClients();
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!clientId) {
      toast.error('Client is required');
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      toast.error('Valid amount is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        clientId,
        amount: Number(amount),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });
      toast.success('Invoice created');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="bg-muted/30 border-border border-b">
      <td className="py-2 pl-4 pr-2"><span className="text-muted-foreground text-sm">+</span></td>
      <td className="py-2 pr-2"><span className="text-muted-foreground text-xs font-mono">NEW</span></td>
      <td className="py-2 pr-2">
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select client..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-2 pr-2"><span className="text-muted-foreground text-xs">—</span></td>
      <td className="py-2 pr-2">
        <Input
          autoFocus
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount..."
          className="h-8 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </td>
      <td className="py-2 pr-2"><span className="text-muted-foreground text-xs">14 days</span></td>
      <td className="py-2 pr-2"><span className="text-muted-foreground text-xs">Draft</span></td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleSave} disabled={saving}>
            <Check className="h-3.5 w-3.5 text-green-500" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onCancel}>
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
```

---

## Task 5: Update Projects Page

**Files:**
- Modify: `src/app/dashboard/projects/page.tsx`

Changes:
1. Remove `formOpen` state and `ProjectForm` dialog
2. Add `addingRow` state (boolean) — when true, show `ProjectInlineRow` at top of table
3. Replace "New Project" button click to toggle `addingRow`
4. Move the `<Table>` inside a conditional — always render, but prepend `ProjectInlineRow` when `addingRow === true`
5. Keep edit button (pencil) behavior: clicking edit icon sets the row into edit mode

```tsx
// Replace formOpen state with:
const [addingRow, setAddingRow] = useState(false);

// Replace the "Add" button handler:
const handleOpenNew = () => setAddingRow(true);
const handleCancelAdd = () => setAddingRow(false);

// In the Table, prepend the inline row:
<TableBody>
  {addingRow && (
    <ProjectInlineRow
      mode="add"
      clients={clients}
      onSave={handleSubmit}
      onCancel={handleCancelAdd}
    />
  )}
  {paginated.map(...)}
</TableBody>
```

Keep the "Edit" pencil button behavior for editing existing rows. For edit, use the same `ProjectInlineRow` with `mode="edit"`.

**Note:** Keep `ProjectForm` component file — it will still be used for more complex edit scenarios (detail page, etc.). Only remove the Dialog popup from the list page.

---

## Task 6: Update Clients Page

**Files:**
- Modify: `src/app/dashboard/clients/page.tsx`

Same pattern as Task 5:
1. Remove `formOpen` state and `ClientForm` dialog
2. Add `addingRow` state
3. Replace "Add Client" button to toggle `addingRow`
4. Prepend `ClientInlineRow` to table body when `addingRow === true`

---

## Task 7: Update Finance Page

**Files:**
- Modify: `src/app/dashboard/finance/page.tsx`

Same pattern as Task 5:
1. Remove `formOpen` state and `InvoiceForm` dialog
2. Add `addingRow` state
3. Replace "New Invoice" button to toggle `addingRow`
4. Prepend `InvoiceInlineRow` to table body when `addingRow === true`

**Note:** Keep `InvoiceForm` component for the detail page. Only remove from list page.

---

## Verification

1. **Add via inline row:** Click "New Project" → editable row appears at top of table → type name → press Enter or click ✓ → row saves → toast appears
2. **Cancel add:** Click "New Project" → editable row → click ✗ → row disappears
3. **Keyboard shortcut:** Tab navigates between fields, Enter saves, Escape cancels
4. **Edit via inline row:** Click pencil on existing row → row becomes editable → change value → save
5. **No dialog:** No Dialog/modal popup appears for add/edit on list pages
6. **Complex forms still work:** ProjectForm/ClientForm/InvoiceForm components still exist for complex editing (detail pages)