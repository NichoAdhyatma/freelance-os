# Invoice Builder Page — Design Spec
**Date:** 2026-06-30
**Status:** Approved
**Type:** Feature — New Page

---

## Overview

Membuat halaman `/dashboard/invoices/new` sebagai Invoice Builder dengan three-panel layout. Halaman ini memungkinkan freelancer membuat invoice profesional dengan antarmuka yang bersih dan live preview.

---

## URL & Navigation

- **Path:** `/dashboard/invoices/new`
- **Access:** Dashboard nav (tombol "New Invoice" di finance page)
- **New menu item** di dashboard sidebar: "Invoice Builder" atau menggunakan CTA button di finance page

---

## Layout: Three-Panel

```
┌─────────────────┬───────────────────────────────┬──────────────────┐
│  META PANEL     │  LINE ITEMS PANEL              │  PREVIEW PANEL   │
│  (~280px)       │  (flex-1)                      │  (~360px)        │
│                 │                               │                  │
│  Invoice #      │  ┌─────┬─────────┬────┬─────┐│  [Invoice Card]  │
│  Client         │  │ Desc│ Qty     │Price│Total││                  │
│  Due Date       │  ├─────┼─────────┼────┼─────┤│  (live preview   │
│  Status         │  │ ... │ ...     │... │ ... ││   of invoice)    │
│  Notes          │  └─────┴─────────┴────┴─────┘│                  │
│                 │                               │  ──────────────  │
│  [Save Draft]   │  [ + Add Row ]                │  [Download PDF]  │
│  [Mark as Sent] │                               │  [WhatsApp]      │
│                 │  ─────────────────────────     │                  │
│                 │  Subtotal: Rp XXX              │                  │
│                 │  Tax:       Rp XXX             │                  │
│                 │  Discount:  Rp XXX             │                  │
│                 │  ─────────────────────────     │                  │
│                 │  TOTAL:    Rp XXX              │                  │
└─────────────────┴───────────────────────────────┴──────────────────┘
```

---

## Panel 1: Meta

| Field | Type | Notes |
|-------|------|-------|
| Invoice Number | Input (readonly + editable) | Default: auto-generated `INV-{YEAR}-{SEQUENCE}` |
| Client | Command Popover Select | Pilihan dari collection clients, tampilkan nama + company |
| Due Date | Calendar Popover | Default: +14 hari dari today |
| Status | Select | Options: `draft`, `sent`, `paid` — default `draft` |
| Notes | Textarea | Optional, max 500 chars |

---

## Panel 2: Line Items

### Table Columns

| Column | Width | Alignment |
|--------|-------|-----------|
| Description | flex-1 | left |
| Qty | 80px | right |
| Unit Price | 120px | right |
| Total | 120px | right |

### Row Behavior

- Setiap row punya field: Description (text), Qty (number, min 1), Unit Price (number)
- Total per row = Qty × Unit Price (auto-calculated)
- Add Row (+) button di bawah table
- Delete row (×) button muncul di hover row
- Minimum 1 row selalu ada (tidak bisa hapus semua)
- Empty description tidak di-allow (validation)

### Totals Section

| Field | Type | Notes |
|-------|------|-------|
| Subtotal | Readonly | Sum of all row totals |
| Tax | Number Input | Amount in IDR (not percentage) |
| Discount | Number Input | Amount in IDR |
| **Grand Total** | Readonly bold | Subtotal + Tax − Discount |

---

## Panel 3: Preview

- Live-updating invoice card (read-only visual representation)
- Format: profesional invoice layout dengan logo/nama, client info, line items, totals
- Background: white, shadow, border-radius (mirrors actual PDF output)
- **Download PDF** button — triggers existing `downloadInvoicePDF` function
- **Send to WhatsApp** button — opens wa.me link dengan text invoice summary

---

## Actions

| Action | Behavior |
|--------|----------|
| Save as Draft | Simpan invoice dengan status `draft`, redirect ke `/dashboard/finance` |
| Mark as Sent | Simpan invoice dengan status `sent`, redirect ke `/dashboard/finance` |
| Download PDF | Generate & download PDF via existing pdf utility |
| Discard / Back | Konfirmasi dialog jika ada perubahan belum disimpan |

---

## Data Flow

1. User input di Panel 1 & 2 → local state (React useState/useReducer)
2. Panel 3 preview derived dari state (computed values, no extra fetch)
3. On save → call `invoiceService.createInvoice(data)` → Firestore write
4. On success → redirect ke `/dashboard/finance`
5. On error → toast error notification

---

## State Shape

```typescript
interface InvoiceBuilderState {
  invoiceNumber: string;       // auto-generated, editable
  clientId: string;            // required
  dueDate: Date;               // required
  status: 'draft' | 'sent' | 'paid';
  notes: string;
  items: InvoiceItem[];
  tax: number;
  discount: number;
  // computed:
  subtotal: number;           // derived
  grandTotal: number;          // derived
}
```

---

## Validation

| Rule | Error Message |
|------|---------------|
| Client required | "Pilih client terlebih dahulu" |
| At least 1 item | "Tambahkan minimal 1 item" |
| Description required per item | "Deskripsi tidak boleh kosong" |
| Qty >= 1 | "Qty minimal 1" |
| Unit price >= 0 | "Harga tidak boleh negatif" |

---

## Component Inventory

| Component | Location | Description |
|-----------|----------|-------------|
| `InvoiceBuilderPage` | `src/app/dashboard/invoices/new/page.tsx` | Page shell, sets dashboard title |
| `InvoiceBuilder` | `src/components/invoices/InvoiceBuilder.tsx` | Three-panel layout container |
| `MetaPanel` | inside `InvoiceBuilder` | Left panel with form fields |
| `LineItemsEditor` | `src/components/invoices/LineItemsEditor.tsx` | Center panel table |
| `InvoicePreview` | `src/components/invoices/InvoicePreview.tsx` | Right panel live preview |
| `LineItemRow` | inside `LineItemsEditor` | Single row component |
| `TotalsSection` | inside `LineItemsEditor` | Subtotal/tax/discount/total |

---

## Reused Components

- `StatusBadge` — dari `src/components/shared/StatusBadge.tsx`
- shadcn: `Button`, `Input`, `Textarea`, `Calendar`, `Popover`, `Command`, `Select`, `DropdownMenu`
- `PopoverCell` / `SelectCell` patterns — untuk client select
- `downloadInvoicePDF` — dari `src/lib/pdf/downloadInvoicePDF`
- `useInvoices` — hook untuk simpan data
- `invoiceService.createInvoice` — untuk Firestore write

---

## Reused Hooks & Services

- `useInvoices()` — untuk `createInvoice`
- `useClients()` — untuk populate client dropdown
- `invoiceService.createInvoice()`

---

## Edge Cases

1. **Discard changes** — jika user ubah data lalu klik back, muncul confirmation dialog
2. **Empty invoice** — Save disabled jika tidak ada client atau tidak ada line items
3. **Large amounts** — Format currency dengan `Intl.NumberFormat('id-ID')`
4. **Long description** — Text truncate dengan ellipsis di preview, full text di PDF

---

## File Plan

```
src/
├── app/dashboard/invoices/
│   └── new/
│       └── page.tsx                    NEW
├── components/invoices/
│   ├── InvoiceBuilder.tsx              NEW
│   ├── LineItemsEditor.tsx            NEW
│   └── InvoicePreview.tsx             NEW
```

---

## Implementation Order

1. `LineItemsEditor` — line items table + totals
2. `InvoicePreview` — live preview card
3. `InvoiceBuilder` — assemble 3 panels
4. `InvoiceBuilderPage` — page shell + routing
5. Add "New Invoice" button di finance page & sidebar
