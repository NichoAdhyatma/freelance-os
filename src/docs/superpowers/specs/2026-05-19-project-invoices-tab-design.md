# Project Invoices Tab — Design Spec

**Date:** 2026-05-19
**Status:** Approved

---

## Overview

Menambahkan tab **Invoices** di Project Detail Page (`/dashboard/projects/[id]`). 1 project bisa memiliki beberapa invoice — tab ini menampilkan semua invoice yang关联 ke project tersebut, dengan summary pembayaran dan quick actions.

---

## User Flow

1. User buka project detail page → melihat tab Tasks, **Invoices**, Details, Notes
2. Klik tab Invoices → tampil list invoice project tersebut + summary card
3. User bisa: buat invoice baru (pre-populated), lihat detail, mark as paid, delete
4. Buat invoice → pre-populate `projectId` dan `clientId` dari context project

---

## Tab Structure

```
Tasks | Invoices | Details | Notes
```

Tab Invoices di-insert sebagai tab kedua (setelah Tasks).

---

## Invoice List — UI

### Summary Card (atas)

3 metric cards dalam grid 3 kolom:

| Metric | Calculation |
|---|---|
| Total Billed | Σ `invoice.amount` semua invoice project |
| Total Paid | Σ (jika status `paid` → `invoice.amount`; jika `partial` → `invoice.amountPaid`; lainnya → 0) |
| Outstanding | Total Billed − Total Paid |

Format: IDR currency (tanpa desimal), label di atas, angka besar di bawah.

### Invoice Table (bawah)

Kolom:

| Column | Source |
|---|---|
| Invoice # | `invoice.invoiceNumber` |
| Title | `invoice.title ?? invoice.invoiceNumber` |
| Amount | `invoice.amount` formatted IDR |
| Status | Badge warna berdasarkan `invoice.status` |
| Due Date | `invoice.dueDate` formatted "dd MMM yyyy" |
| Actions | Quick actions (paid / delete) |

### Status Badge Colors

| Status | Color |
|---|---|
| `draft` | zinc |
| `sent` | blue |
| `pending` | yellow |
| `paid` | green |
| `overdue` | red |
| `cancelled` | muted |

### Empty State

Kalau belum ada invoice untuk project ini:
- Icon: `Receipt` atau `FileText`
- Teks: "No invoices for this project yet"
- Tombol: "Create First Invoice" (trigger create sheet)

---

## Create Invoice — Behavior

**Trigger:** Tombol "Create Invoice" di header tab Invoices.

**Flow:**
1. User klik "Create Invoice"
2. Open `InvoiceForm` sheet (reuse dari Finance page)
3. `clientId` pre-populated dari `project.clientId`
4. `projectId` pre-populated dari current project ID
5. User lengkapi: title, amount, items, due date, notes
6. Submit → invoice dibuat → list refresh otomatis (realtime subscription)
7. Sheet close + toast success

**Navigation:** Sheet overlay di project page — tidak perlu navigate ke `/dashboard/finance`.

---

## Technical Implementation

### Data Loading

- `useInvoices` hook (already exists) di-attach di `ProjectDetailPage`
- Tab Invoices filter: `invoices.filter(i => i.projectId === id)`
- No new Firestore queries — reuse existing realtime subscription

### InvoiceForm Integration

- `InvoiceForm` component sudah ada di Finance module
- Pass `defaultClientId={project.clientId}` dan `defaultProjectId={project.id}`
- Form post-submit → close sheet → list auto-updates via realtime subscription

### File Changes

**Modified:**
- `src/app/dashboard/projects/[id]/page.tsx`
  - Import `InvoiceForm` component
  - Import `useInvoices` hook
  - Add `Invoices` tab trigger
  - Add `TabsContent value="invoices"` dengan summary + table + create button
  - State untuk sheet open/close
  - `useInvoices` di-level atas (page component) untuk realtime

**No new files created** — semua di-embed langsung di page.tsx untuk simplicity.

### Invoice Type Enhancement

Existing `Invoice` type (`src/types/invoice.ts`) sudah punya `projectId?: string` dan `amountPaid?: number` — tidak ada perubahan type needed.

---

## Components Used

- `Badge` — status badge
- `Card` / `CardContent` — summary card
- `Button` — actions
- `Sheet` — InvoiceForm overlay
- `Table` / `TableHeader` / `TableRow` / `TableCell` — invoice table (existing shadcn)
- `InvoiceForm` — reuse from Finance
- `Skeleton` — loading state

---

## Summary

1 Project → many Invoices. Tab Invoices di project detail page menampilkan semua invoice project dengan summary payment dan quick actions (create, mark paid, delete). Create invoice reuse InvoiceForm dengan pre-populated project/client context.