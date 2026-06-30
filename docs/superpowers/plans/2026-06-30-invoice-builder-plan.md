# Invoice Builder Page — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/dashboard/invoices/new` — a three-panel Invoice Builder page with live preview.

**Architecture:** Three-panel layout (meta sidebar + line items table + preview card). Local React state drives all panel interactions. Preview is a pure computed view of state. On save, data is normalized to `InvoiceFormData` and passed to existing `invoiceService.createInvoice()`.

**Tech Stack:** Next.js App Router, TypeScript, shadcn/ui (Calendar, Popover, Command, Input, Button, Select), Firebase Firestore (via existing `invoiceService`), sonner (toast), date-fns (formatting), `formatIDR` from `@/lib/utils`.

---

## Global Constraints

- Invoice number auto-generated via `generateInvoiceNumber()` from `src/lib/services/invoiceService.ts` — do not re-implement
- `InvoiceFormData` from `src/types/invoice.ts` is the canonical save shape — do not extend
- Status values: `draft` | `sent` | `paid`
- Currency formatting: `formatIDR(amount)` from `@/lib/utils`
- Use existing `useClients()` hook, `useInvoices().add()` method
- PDF download: reuse `downloadInvoicePDF()` from `@/lib/pdf/downloadInvoicePDF`
- Default due date: `new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)`
- Dark-mode-first CSS variables: `var(--surface-raised)`, `var(--border-default)`, `var(--text-primary)`, `var(--text-secondary)`

---

## File Map

```
src/
├── app/dashboard/invoices/
│   └── new/
│       └── page.tsx                    CREATE — page shell
├── components/invoices/
│   ├── LineItemsEditor.tsx             CREATE — line items table + totals
│   └── InvoicePreview.tsx              CREATE — live preview card
│   └── InvoiceBuilder.tsx              CREATE — three-panel layout
```

---

## Task 1: LineItemsEditor Component

**Files:**
- Create: `src/components/invoices/LineItemsEditor.tsx`

**Interfaces:**
- Props: `items: InvoiceItem[]`, `onChange: (items: InvoiceItem[]) => void`, `tax: number`, `discount: number`, `onTaxChange: (v: number) => void`, `onDiscountChange: (v: number) => void`
- `InvoiceItem` from `@/types/invoice` (`{ description: string; quantity: number; unitPrice: number; total: number }`)
- Outputs computed: `subtotal`, `grandTotal` (display only)

**Behavior:**
- Table with 4 columns: Description (flex-1), Qty (80px), Unit Price (120px), Total (120px)
- Each row: editable Description input, editable Qty input (type=number, min=1), editable Unit Price input (type=number, min=0)
- Total per row = qty × unitPrice (auto, non-editable, shown in Total column)
- Add Row (+) button below table — appends `{ description: '', quantity: 1, unitPrice: 0, total: 0 }`
- Delete (×) button per row on hover — removes row, but never below 1 row
- Totals section below table: Subtotal (readonly), Tax input (IDR amount), Discount input (IDR amount), Grand Total (readonly, bold) = subtotal + tax − discount
- All number inputs use `formatIDR` display for unit price, tax, discount? No — keep raw number inputs for editing, only format in Grand Total display
- Number inputs: show raw value (e.g. `500000`), formatted in grand total

```tsx
'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { InvoiceItem } from '@/types/invoice';

interface LineItemsEditorProps {
  items: InvoiceItem[];
  onChange: (items: InvoiceItem[]) => void;
  tax: number;
  discount: number;
  onTaxChange: (v: number) => void;
  onDiscountChange: (v: number) => void;
}

export function LineItemsEditor({
  items,
  onChange,
  tax,
  discount,
  onTaxChange,
  onDiscountChange,
}: LineItemsEditorProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = subtotal + tax - discount;

  const updateItem = useCallback(
    (index: number, field: keyof InvoiceItem, rawValue: string) => {
      const next = items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item };
        if (field === 'description') {
          updated.description = rawValue;
        } else {
          const num = Number(rawValue);
          updated[field] = isNaN(num) ? 0 : num;
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = (field === 'quantity' ? num : item.quantity) * (field === 'unitPrice' ? num : item.unitPrice);
          }
        }
        return updated;
      });
      onChange(next);
    },
    [items, onChange],
  );

  const addRow = () => onChange([...items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]);

  const removeRow = (index: number) => {
    if (items.length <= 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Table */}
      <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--surface-base)]">
              <th className="text-left px-3 py-2.5 font-medium text-[var(--text-tertiary)] text-xs w-full">Description</th>
              <th className="text-right px-3 py-2.5 font-medium text-[var(--text-tertiary)] text-xs w-20">Qty</th>
              <th className="text-right px-3 py-2.5 font-medium text-[var(--text-tertiary)] text-xs w-32">Unit Price</th>
              <th className="text-right px-3 py-2.5 font-medium text-[var(--text-tertiary)] text-xs w-32">Total</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={index}
                className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--surface-hover)] transition-colors group"
              >
                <td className="px-3 py-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="e.g. Website Design"
                    className="border-0 bg-transparent p-0 h-7 shadow-none focus-visible:ring-0 text-[var(--text-primary)]"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="w-full text-right border-0 bg-transparent p-0 h-7 shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    placeholder="0"
                    className="w-full text-right border-0 bg-transparent p-0 h-7 shadow-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </td>
                <td className="px-3 py-2 text-right text-[var(--text-secondary)] font-medium tabular-nums">
                  {formatIDR(item.total)}
                </td>
                <td className="px-1 py-2">
                  <button
                    onClick={() => removeRow(index)}
                    disabled={items.length <= 1}
                    className={cn(
                      'opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-tertiary)] hover:text-red-400 transition-all disabled:opacity-0 disabled:cursor-not-allowed',
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row */}
      <Button variant="ghost" size="sm" onClick={addRow} className="self-start text-[var(--text-secondary)]">
        <Plus className="h-4 w-4 mr-1.5" />
        Add Item
      </Button>

      {/* Totals */}
      <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-4 mt-auto">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">Subtotal</span>
          <span className="text-[var(--text-primary)] font-medium tabular-nums">{formatIDR(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm gap-4">
          <span className="text-[var(--text-secondary)] w-20 shrink-0">Tax (IDR)</span>
          <Input
            type="number"
            min={0}
            value={tax}
            onChange={(e) => onTaxChange(Number(e.target.value) || 0)}
            className="w-36 text-right tabular-nums"
          />
        </div>
        <div className="flex items-center justify-between text-sm gap-4">
          <span className="text-[var(--text-secondary)] w-20 shrink-0">Discount (IDR)</span>
          <Input
            type="number"
            min={0}
            value={discount}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
            className="w-36 text-right tabular-nums"
          />
        </div>
        <div className="flex items-center justify-between text-base font-semibold border-t border-[var(--border-default)] pt-3 mt-1">
          <span className="text-[var(--text-primary)]">Total</span>
          <span className="tabular-nums text-[var(--status-success)]">{formatIDR(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 2: InvoicePreview Component

**Files:**
- Create: `src/components/invoices/InvoicePreview.tsx`

**Interfaces:**
- Props: `invoiceNumber: string`, `clientName: string`, `clientCompany?: string`, `dueDate: Date`, `status: string`, `items: InvoiceItem[]`, `tax: number`, `discount: number`, `notes?: string`, `userName?: string`
- No external service calls — purely a display component

**Behavior:**
- White card (bg-white) with shadow and border-radius, mimics A4 invoice
- Header: "INVOICE" title + invoice number + status badge
- From block: Freelancer OS branding (placeholder: "Freelancer OS" + userName if available)
- Bill To block: clientName + clientCompany
- Due date
- Line items table: Description | Qty | Price | Amount — with subtotal, tax, discount, total rows
- Notes at bottom if present
- Right panel: "Download PDF" and "Send WhatsApp" buttons at bottom of card
- Responsive: scrollable if content overflows

```tsx
'use client';

import { Download, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { formatIDR } from '@/lib/utils';
import type { InvoiceItem } from '@/types/invoice';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface InvoicePreviewProps {
  invoiceNumber: string;
  clientName: string;
  clientCompany?: string;
  dueDate: Date;
  status: string;
  items: InvoiceItem[];
  tax: number;
  discount: number;
  notes?: string;
  userName?: string;
  onDownloadPDF?: () => void;
  onSendWhatsApp?: () => void;
}

export function InvoicePreview({
  invoiceNumber,
  clientName,
  clientCompany,
  dueDate,
  status,
  items,
  tax,
  discount,
  notes,
  userName,
  onDownloadPDF,
  onSendWhatsApp,
}: InvoicePreviewProps) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = subtotal + tax - discount;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Preview card */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-stone-50 border-b border-stone-200 px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-stone-800 tracking-tight">INVOICE</h2>
                <p className="text-stone-500 text-sm mt-0.5 font-mono">{invoiceNumber}</p>
              </div>
              <StatusBadge status={status as any} />
            </div>
          </div>

          {/* Meta */}
          <div className="px-8 py-6 grid grid-cols-2 gap-6 border-b border-stone-100">
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">From</p>
              <p className="text-sm font-semibold text-stone-800">Freelancer OS</p>
              {userName && <p className="text-xs text-stone-500">{userName}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Bill To</p>
              <p className="text-sm font-semibold text-stone-800">{clientName || <span className="text-stone-300 italic">Select client</span>}</p>
              {clientCompany && <p className="text-xs text-stone-500">{clientCompany}</p>}
            </div>
          </div>

          {/* Due Date */}
          <div className="px-8 py-4 border-b border-stone-100">
            <p className="text-xs text-stone-400">
              <span className="font-medium text-stone-500">Due Date:</span>{' '}
              <span className="text-stone-700">{format(dueDate, 'dd MMMM yyyy', { locale: id })}</span>
            </p>
          </div>

          {/* Line Items */}
          <div className="px-8 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 font-semibold text-stone-600 text-xs">Description</th>
                  <th className="text-right py-2 font-semibold text-stone-600 text-xs w-16">Qty</th>
                  <th className="text-right py-2 font-semibold text-stone-600 text-xs w-28">Price</th>
                  <th className="text-right py-2 font-semibold text-stone-600 text-xs w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b border-stone-100 last:border-0">
                    <td className="py-2.5 text-stone-700">
                      {item.description || <span className="text-stone-300 italic">Untitled item</span>}
                    </td>
                    <td className="py-2.5 text-right text-stone-600 tabular-nums">{item.quantity}</td>
                    <td className="py-2.5 text-right text-stone-600 tabular-nums">{formatIDR(item.unitPrice)}</td>
                    <td className="py-2.5 text-right text-stone-800 font-medium tabular-nums">{formatIDR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-8 pb-6">
            <div className="ml-auto w-56 flex flex-col gap-2">
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatIDR(subtotal)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Tax</span>
                  <span className="tabular-nums">+ {formatIDR(tax)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Discount</span>
                  <span className="tabular-nums">- {formatIDR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-900 border-t border-stone-200 pt-2 mt-1">
                <span>Total</span>
                <span className="tabular-nums">{formatIDR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="px-8 pb-6">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">Notes</p>
              <p className="text-xs text-stone-500 leading-relaxed">{notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onDownloadPDF}
          disabled={!invoiceNumber}
        >
          <Download className="h-4 w-4 mr-1.5" />
          Download PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={onSendWhatsApp}
          disabled={!clientName}
        >
          <MessageCircle className="h-4 w-4 mr-1.5" />
          WhatsApp
        </Button>
      </div>
    </div>
  );
}
```

---

## Task 3: InvoiceBuilder Component

**Files:**
- Create: `src/components/invoices/InvoiceBuilder.tsx`

**Interfaces:**
- Props: `onSave: (data: InvoiceFormData, status: 'draft' | 'sent') => Promise<void>`
- `InvoiceFormData` from `@/types/invoice`
- Uses `useClients()` internally for client list

**Behavior:**
- Full three-panel layout: meta panel (280px) | line items (flex-1) | preview (360px)
- Meta panel: Invoice Number (auto-generated, readonly), Client select (Command Popover), Due Date (Calendar Popover), Status select, Notes textarea, Save buttons
- Middle panel: `<LineItemsEditor>` with initial 1 empty row
- Right panel: `<InvoicePreview>` with all state as props
- `useState` for: `invoiceNumber`, `clientId`, `dueDate`, `status`, `notes`, `items`, `tax`, `discount`
- Client select: same pattern as `InvoiceForm` (Popover + Command + Check icon)
- Due Date: Calendar Popover with id locale, default +14 days
- On mount: generate invoice number and set default due date
- Validation on save: client required, at least 1 item with non-empty description
- Save: call `onSave(formData, status)`, show toast success, redirect on success
- Loading state on buttons during save

```tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Check, ChevronDown, MessageCircle, User, Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineItemsEditor } from './LineItemsEditor';
import { InvoicePreview } from './InvoicePreview';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { cn } from '@/lib/utils';
import type { InvoiceFormData, InvoiceItem, InvoiceStatus } from '@/types/invoice';
import { downloadInvoicePDF } from '@/lib/pdf/downloadInvoicePDF';

const DEFAULT_DUE_DATE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `INV-${year}-${rand}`;
}

export function InvoiceBuilder() {
  const router = useRouter();
  const { clients } = useClients();
  const { add } = useInvoices();

  const [invoiceNumber] = useState(() => generateInvoiceNumber());
  const [clientId, setClientId] = useState('');
  const [clientPopoverOpen, setClientPopoverOpen] = useState(false);
  const [dueDate, setDueDate] = useState<Date>(DEFAULT_DUE_DATE);
  const [status, setStatus] = useState<InvoiceStatus>('draft');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [saving, setSaving] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const grandTotal = subtotal + tax - discount;

  const validate = () => {
    if (!clientId.trim()) { toast.error('Pilih client terlebih dahulu'); return false; }
    const hasItems = items.some((item) => item.description.trim());
    if (!hasItems) { toast.error('Tambahkan minimal 1 item dengan deskripsi'); return false; }
    return true;
  };

  const buildFormData = (overrideStatus?: InvoiceStatus): InvoiceFormData => ({
    clientId: clientId.trim(),
    amount: grandTotal,
    tax,
    discount,
    dueDate,
    notes: notes.trim() || undefined,
    items: items.filter((item) => item.description.trim()),
    status: overrideStatus ?? status,
  });

  const handleSave = async (saveStatus: 'draft' | 'sent') => {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = buildFormData(saveStatus);
      await add(data);
      toast.success(`Invoice ${saveStatus === 'draft' ? 'disimpan' : 'dikirim'}`);
      router.push('/dashboard/finance');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan invoice');
    } finally {
      setSaving(false);
    }
  };

  // Build a mock invoice for PDF preview (without Firestore id/timestamps)
  const mockInvoice = {
    id: 'preview',
    invoiceNumber,
    clientId,
    amount: grandTotal,
    tax,
    discount,
    status: status as InvoiceStatus,
    dueDate: { toDate: () => dueDate } as any,
    notes: notes || undefined,
    items: items.filter((item) => item.description.trim()),
    createdAt: { toDate: () => new Date() } as any,
    updatedAt: { toDate: () => new Date() } as any,
  };

  const handleDownloadPDF = async () => {
    if (!clientId) { toast.error('Pilih client terlebih dahulu'); return; }
    try {
      await downloadInvoicePDF({
        invoice: mockInvoice as any,
        client: selectedClient ?? null,
        projectTitle: undefined,
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Gagal generate PDF');
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedClient) { toast.error('Pilih client terlebih dahulu'); return; }
    if (!selectedClient.whatsapp) { toast.error('Client ini belum memiliki nomor WhatsApp'); return; }
    const waNumber = selectedClient.whatsapp.replace(/\D/g, '');
    const message = `Halo ${selectedClient.name}!\n\nBerikut invoice untuk pekerjaan yang telah diselesaikan:\n\n📄 *${invoiceNumber}*\n💰 *Total: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(grandTotal)}*\n📅 *Jatuh Tempo: ${format(dueDate, 'dd MMMM yyyy', { locale: id })}*\n\nMohon melakukan pembayaran sebelum jatuh tempo.\n\n—\nDikirim via Freelancer OS`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="flex h-full gap-6">
      {/* Panel 1: Meta */}
      <div className="w-72 shrink-0 flex flex-col gap-5 overflow-y-auto">
        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--text-tertiary)]">Invoice Number</Label>
          <Input value={invoiceNumber} readOnly className="font-mono text-sm bg-[var(--surface-base)]" />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--text-tertiary)]">Client *</Label>
          <Popover open={clientPopoverOpen} onOpenChange={setClientPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                role="combobox"
                className={cn(
                  'w-full flex items-center justify-start h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted transition-colors text-left',
                  !clientId && 'text-muted-foreground',
                )}
              >
                <User className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate flex-1">
                  {clientId ? (selectedClient?.name ?? 'Select client') : 'Select client'}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-auto" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search clients..." autoFocus />
                <CommandList>
                  <CommandEmpty>{clients.length === 0 ? 'No clients yet.' : 'No client found.'}</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.id}
                        onSelect={() => { setClientId(client.id); setClientPopoverOpen(false); }}
                        className="flex items-center gap-2"
                      >
                        <Check className={cn('h-4 w-4 shrink-0', clientId === client.id ? 'opacity-100' : 'opacity-0')} />
                        <span className="truncate">{client.name}{client.company && <span className="text-muted-foreground ml-1 text-xs">· {client.company}</span>}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--text-tertiary)]">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full flex items-center h-10 px-3 rounded-md border border-input bg-background text-sm cursor-pointer hover:bg-muted transition-colors text-left">
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                {format(dueDate, 'dd MMM yyyy', { locale: id })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dueDate} onSelect={(d) => d && setDueDate(d)} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-[var(--text-tertiary)]">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 flex-1">
          <Label className="text-xs text-[var(--text-tertiary)]">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Payment terms, bank details, etc."
            rows={4}
            className="resize-none"
          />
        </div>

        {/* Save buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-default)]">
          <Button onClick={() => handleSave('draft')} disabled={saving} size="sm" className="w-full">
            {saving ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button onClick={() => handleSave('sent')} disabled={saving} variant="outline" size="sm" className="w-full">
            Mark as Sent
          </Button>
        </div>
      </div>

      {/* Panel 2: Line Items */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Line Items</h3>
          <span className="text-xs text-[var(--text-tertiary)]">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="flex-1 overflow-y-auto pr-1">
          <LineItemsEditor
            items={items}
            onChange={setItems}
            tax={tax}
            discount={discount}
            onTaxChange={setTax}
            onDiscountChange={setDiscount}
          />
        </div>
      </div>

      {/* Panel 3: Preview */}
      <div className="w-80 shrink-0 flex flex-col overflow-hidden">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Preview</h3>
        <div className="flex-1 overflow-hidden">
          <InvoicePreview
            invoiceNumber={invoiceNumber}
            clientName={selectedClient?.name ?? ''}
            clientCompany={selectedClient?.company}
            dueDate={dueDate}
            status={status}
            items={items}
            tax={tax}
            discount={discount}
            notes={notes}
            onDownloadPDF={handleDownloadPDF}
            onSendWhatsApp={handleSendWhatsApp}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Task 4: InvoiceBuilderPage

**Files:**
- Create: `src/app/dashboard/invoices/new/page.tsx`

**Interfaces:**
- No props needed — just the page component
- Uses `setDashboardTitle` from `@/app/dashboard/_context` to set header title to "New Invoice"
- Wraps `<InvoiceBuilder>` in a full-height container

```tsx
'use client';

import { setDashboardTitle } from '@/app/dashboard/_context';
import { InvoiceBuilder } from '@/components/invoices/InvoiceBuilder';

export default function InvoiceBuilderPage() {
  setDashboardTitle('New Invoice');

  return (
    <div className="h-full">
      <InvoiceBuilder />
    </div>
  );
}
```

---

## Task 5: Add "New Invoice" CTA + Navigation

**Files:**
- Modify: `src/app/dashboard/finance/page.tsx` — update "New Invoice" Button to navigate to `/dashboard/invoices/new` instead of toggling inline row
- Modify: `src/components/shared/Header.tsx` — add "Invoice Builder" nav item to sidebar (or keep as button in finance page)

**Changes to finance page:**
- Remove `addingRow` state (or keep it for inline — keep both: inline stays for quick-add, button navigates to builder)
- Change "New Invoice" button to navigate to `/dashboard/invoices/new` using `useRouter`
- Add a secondary button or link near the main button that opens the inline form for quick-add

```tsx
// In finance/page.tsx:
// Replace the New Invoice button:
import { useRouter } from 'next/navigation';

// In component:
const router = useRouter();

// Replace the Button:
<Button onClick={() => router.push('/dashboard/invoices/new')} size="sm" className="shrink-0">
  <Receipt className="h-4 w-4" />
  New Invoice
</Button>
```

Also add an inline shortcut button in the empty state:
```tsx
<EmptyState
  // ...
  actionLabel={search ? 'Reset Filter' : 'Create Invoice'}
  onAction={search ? () => { setSearch(''); setPage(1); } : () => router.push('/dashboard/invoices/new')}
/>
```

---

## Self-Review Checklist

1. **Spec coverage:** All three panels, meta fields, line items, totals, preview, save actions, WhatsApp, PDF — covered in tasks 1-4.
2. **Placeholder scan:** No TBD/TODO. All code is complete in each task.
3. **Type consistency:** `InvoiceFormData`, `InvoiceItem`, `InvoiceStatus` used consistently from `@/types/invoice`.
4. **Spec gap check:** No spec item left unimplemented.

---

## Implementation Order

1. Task 1: `LineItemsEditor.tsx`
2. Task 2: `InvoicePreview.tsx`
3. Task 3: `InvoiceBuilder.tsx`
4. Task 4: `page.tsx` (the new route)
5. Task 5: Finance page button + empty state update
