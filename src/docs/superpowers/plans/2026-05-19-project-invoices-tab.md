# Project Invoices Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan tab Invoices di Project Detail Page (`/dashboard/projects/[id]`) — menampilkan semua invoice milik project dengan summary payment, quick actions (create, mark paid, delete), dan empty state.

**Architecture:** `InvoiceForm` adalah `Dialog`, bukan `Sheet` — jadi pakai `Dialog` instead of `Sheet` untuk open/close. Data loading via `useInvoices` hook yang udah ada (filter client-side). Pre-populate `clientId` dan `projectId` via `useEffect` saat form di-open dengan initial data. Invoice type sudah punya `projectId?: string` dan `amountPaid?: number` — tidak perlu ubah type.

**Tech Stack:** Next.js App Router, TypeScript, shadcn/ui, Firebase Firestore, Tailwind CSS

---

## File Changes

**Modified:**
- `src/app/dashboard/projects/[id]/page.tsx` — add Invoices tab (Tasks → Invoices → Details → Notes)
- `src/components/invoices/InvoiceForm.tsx` — add `defaultClientId` and `defaultProjectId` props for pre-population

**No new files.** All embedded directly in `page.tsx`.

---

## Task 1: Add `defaultClientId` + `defaultProjectId` props to InvoiceForm

**Files:**
- Modify: `src/components/invoices/InvoiceForm.tsx`

**Context:** `InvoiceForm` sudah punya `initialData` untuk edit mode. Kita perlu menambahkan dua props opsional (`defaultClientId`, `defaultProjectId`) yang pre-populate form fields saat `initialData` null dan props tersebut ada. Ini supaya create invoice dari project page langsung associate ke project & client yang sedang dilihat.

- [ ] **Step 1: Add prop types**

Tambahkan interface `DefaultIds` di atas `InvoiceFormProps`:

```typescript
interface DefaultIds {
  defaultClientId?: string;
  defaultProjectId?: string;
}

interface InvoiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  initialData?: Invoice | null;
  defaultClientId?: string;  // NEW
  defaultProjectId?: string; // NEW
}
```

- [ ] **Step 2: Destructure new props**

Di function signature, ubah:

```typescript
export function InvoiceForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  defaultClientId,  // NEW
  defaultProjectId, // NEW
}: InvoiceFormProps) {
```

- [ ] **Step 3: Pre-populate in the else branch (create mode)**

Di `useEffect` bagian `else` (create mode, `!initialData`), tambahkan pre-population dari props:

```typescript
} else {
  setClientId(defaultClientId ?? '');
  setProjectId(defaultProjectId ?? '');
  // ... rest unchanged
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/invoices/InvoiceForm.tsx
git commit -m "feat(invoices): add defaultClientId/defaultProjectId props to InvoiceForm"
```

---

## Task 2: Build Project Invoices Tab

**Files:**
- Modify: `src/app/dashboard/projects/[id]/page.tsx`

**Context:** Import `useInvoices` hook dan `InvoiceForm`. Filter invoices oleh `projectId`. Render summary cards + table + empty state + create button. `InvoiceForm` adalah `Dialog` component.

**Steps:**

- [ ] **Step 1: Add imports**

Tambahkan di blok imports:

```typescript
import { Receipt } from 'lucide-react';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { useInvoices } from '@/hooks/useInvoices';
import { formatIDR } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
```

- [ ] **Step 2: Add `useInvoices` hook call**

Setelah deklarasi `kanbanRef`, tambahkan:

```typescript
const { invoices, edit: editInvoice, remove: removeInvoice, markPaid } = useInvoices();
```

- [ ] **Step 3: Add state for InvoiceForm sheet + helper computations**

Setelah `defaultTaskStatus` state:

```typescript
const [invoiceFormOpen, setInvoiceFormOpen] = useState(false);

const projectInvoices = invoices.filter((i) => i.projectId === id);

const totalBilled = projectInvoices.reduce((sum, i) => sum + i.amount, 0);
const totalPaid = projectInvoices.reduce((sum, i) => {
  if (i.status === 'paid') return sum + i.amount;
  if (i.status === 'partial') return sum + (i.amountPaid ?? 0);
  return sum;
}, 0);
const outstanding = totalBilled - totalPaid;
```

- [ ] **Step 4: Add create invoice handler**

Tambahkan sebelum `if (loading)`:

```typescript
const handleCreateInvoice = async (data: any) => {
  await useInvoices().add(data);
};
```

> ⚠️ **IMPORTANT:** `useInvoices()` hook harus dipanggil di luar event handlers. Karena hook return `add` dari closure `useInvoices()` yang sudah dipanggil di level atas, kita perlu expose `add` dari hook call di Step 2. Ubah Step 2 jadi:

```typescript
const { invoices, edit: editInvoice, remove: removeInvoice, markPaid, add: addInvoice } = useInvoices();
```

Lalu Step 4 handler:

```typescript
const handleCreateInvoice = async (data: any) => {
  await addInvoice(data);
};
```

- [ ] **Step 5: Add Invoices tab trigger to TabsList**

Dalam `TabsList`, tambahkan setelah `Tasks` trigger:

```tsx
<TabsTrigger value="invoices">Invoices</TabsTrigger>
```

- [ ] **Step 6: Add TabsContent for Invoices**

Tambahkan setelah `TabsContent value="tasks"`:

```tsx
<TabsContent value="invoices" className="mt-4">
  {projectInvoices.length === 0 ? (
    /* Empty State */
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Receipt className="text-muted-foreground/20 mb-3 h-10 w-10" />
        <h3 className="mb-1 text-sm font-medium">No invoices for this project yet</h3>
        <p className="text-muted-foreground mb-4 text-xs">
          Create your first invoice to track payments for this project.
        </p>
        <Button size="sm" onClick={() => setInvoiceFormOpen(true)}>
          Create First Invoice
        </Button>
      </CardContent>
    </Card>
  ) : (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Total Billed</p>
            <p className="text-xl font-bold">{formatIDR(totalBilled)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Total Paid</p>
            <p className="text-xl font-bold text-green-500">{formatIDR(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wide">Outstanding</p>
            <p className="text-xl font-bold text-yellow-500">{formatIDR(outstanding)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Invoice #</TableHead>
              <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Amount</TableHead>
              <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Due Date</TableHead>
              <TableHead className="text-muted-foreground border-border border-r text-xs font-medium">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectInvoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="border-border border-r font-mono text-xs">
                  {inv.invoiceNumber}
                </TableCell>
                <TableCell className="border-border border-r text-sm font-medium">
                  {formatIDR(inv.amount)}
                </TableCell>
                <TableCell className="border-border border-r">
                  <Badge className={getInvoiceStatusColor(inv.status)}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="border-border border-r text-sm text-muted-foreground">
                  {format(inv.dueDate.toDate(), 'dd MMM yyyy', { locale: id })}
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  {inv.status !== 'paid' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={async () => {
                        await markPaid(inv.id, inv.amount);
                        toast.success('Invoice marked as paid');
                      }}
                    >
                      Mark Paid
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-500 hover:text-red-400"
                    onClick={async () => {
                      if (!confirm('Delete this invoice?')) return;
                      await removeInvoice(inv.id);
                      toast.success('Invoice deleted');
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setInvoiceFormOpen(true)}>
          Create Invoice
        </Button>
      </div>
    </div>
  )}
</TabsContent>
```

- [ ] **Step 7: Add `getInvoiceStatusColor` helper + locale import**

Tambahkan di atas component function:

```typescript
import { id } from 'date-fns/locale';

const STATUS_COLORS_INV: Record<string, string> = {
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  sent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  paid: 'bg-green-500/10 text-green-400 border-green-500/20',
  partial: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  overdue: 'bg-red-500/10 text-red-400 border-red-500/20',
  cancelled: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

function getInvoiceStatusColor(status: string): string {
  return STATUS_COLORS_INV[status] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
}
```

Tambahkan juga `id` ke imports date-fns yang sudah ada. Current import di file:
```typescript
import { format } from 'date-fns';
```
Ubah jadi:
```typescript
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
```

- [ ] **Step 8: Add InvoiceForm Dialog + Add `id` import check**

Pastikan `import { id } from 'date-fns/locale'` sudah ada. Lalu tambahkan InvoiceForm Dialog di bawah TaskForm (sebelum penutup `</div>` akhir):

```tsx
{/* Create Invoice Dialog */}
<InvoiceForm
  open={invoiceFormOpen}
  onOpenChange={setInvoiceFormOpen}
  onSubmit={handleCreateInvoice}
  defaultClientId={project.clientId}
  defaultProjectId={id}
/>
```

- [ ] **Step 9: Add `id` from useParams to imports**

Current import:
```typescript
import { use } from 'react';
```
Tambahkan `id` langsung destructured dari `use(params)` call. Sudah ada di Step 2 dari Task 2 — cukup verify destructuring di baris:
```typescript
const { id } = use(params);
```

- [ ] **Step 10: Verify & run dev server**

Run: `npm run dev`
Expected: Halaman `/dashboard/projects/[id]` load tanpa error, tab Invoices muncul setelah Tasks, klik Invoices tab menampilkan empty state atau table invoice.

- [ ] **Step 11: Commit**

```bash
git add src/app/dashboard/projects/[id]/page.tsx
git commit -m "feat(projects): add Invoices tab to project detail page"
```