# Project → Invoice Dropdown Integration Spec

## Context

Freelancer OS already has client dropdowns in `ProjectForm.tsx` and `ProjectRow.tsx`. This spec extends that pattern to support assigning **one invoice per project** (one-to-one relationship), with:
- Filtered invoice list (only invoices matching the selected client)
- "Already used in Project X" visual indicator
- Quick-add invoice inline

## Changes

### 1. Data Model

**`src/types/project.ts`**

```diff
export interface Project {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
+ invoiceId?: string;
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
+ invoiceId?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  deadline?: Date;
  progress?: number;
}
```

**`src/types/invoice.ts`** — no changes (already has `projectId`)

### 2. Invoice Dropdown — Pattern

Both `ProjectForm` and `ProjectRow` share the same pattern as the existing client dropdown:

- Uses `Popover` + `Command` component (already imported in `ProjectForm`)
- Filtered by selected `clientId` — if no client selected, show all invoices
- "Already used" badge: if `invoice.projectId` points to a different project, show `<Badge variant="secondary">Used in {projectTitle}</Badge>`
- "Add New Invoice" button opens `QuickAddInvoiceSheet` (new component)
- "No invoice" / clear option available

### 3. New Component: `QuickAddInvoiceSheet`

- Similar structure to `QuickAddClientSheet`
- Minimal form: client selector (pre-filled from current project), amount, due date, items (optional)
- On submit → creates invoice → returns new `invoiceId` → auto-selects it
- Located at `src/components/finance/QuickAddInvoiceSheet.tsx`

### 4. Files to Modify

| File | Change |
|------|--------|
| `src/types/project.ts` | Add `invoiceId` field |
| `src/components/projects/ProjectForm.tsx` | Add Invoice dropdown (below client, uses existing `Popover+Command` pattern) |
| `src/components/projects/ProjectRow.tsx` | Add Invoice inline dropdown cell (new column) |
| `src/lib/services/projectService.ts` | Add `invoiceId` to add/update functions |
| `src/components/finance/QuickAddInvoiceSheet.tsx` | **New** — inline invoice creation |

### 5. UI Behavior

**ProjectForm dropdown (create/edit):**
- Client dropdown is above invoice dropdown
- When a client is selected → invoice list filters to that client's invoices
- When client is cleared → all invoices shown
- Invoices already assigned to other projects show `Badge variant="secondary">Used in {projectTitle}</Badge>`

**ProjectRow inline dropdown (table):**
- New column between Deadline and Actions (or as the last data column)
- Click to open popover
- Shows invoice number + amount + status
- "No invoice" option to clear

### 6. Invoice Dropdown Item Format

```
[InvoiceNumber] · [Amount (IDR)] · [StatusBadge]
```

e.g.: `INV-2024-001 · Rp 5.000.000 · [Paid]`

### 7. Error Handling

- If no invoices match the filter → "No invoice for this client yet. [Add New]"
- If all invoices are already assigned → "All invoices are already used. [Add New]"
- Quick add sheet has basic validation (amount required, due date required)